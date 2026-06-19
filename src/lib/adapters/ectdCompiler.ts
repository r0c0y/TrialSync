/**
 * eCTD XML Compiler — Enterprise Adapter
 *
 * Maps agent outputs to the electronic Common Technical Document (eCTD) module
 * structure used by regulatory agencies (FDA, EMA) for drug submissions.
 *
 * Produces a fully indexed, completeness-scored eCTD JSON structure that can be
 * consumed by downstream XML serialisers or Veeva-style submission gateways.
 */

// ---------------------------------------------------------------------------
// eCTD Module & Section Interfaces
// ---------------------------------------------------------------------------

export type ECTDSectionStatus = 'COMPLETE' | 'DRAFT' | 'MISSING' | 'NOT_APPLICABLE';

export interface ECTDSection {
  id: string;
  title: string;
  status: ECTDSectionStatus;
  content: any | null;
  sourceAgent: string;
  lastUpdated: string;
  fileReferences: string[];
}

export interface ECTDModule {
  id: string;
  title: string;
  status: ECTDSectionStatus;
  sections: Record<string, ECTDSection>;
}

export interface ECTDSubmission {
  ectd_submission: {
    sequence: string;
    submission_type: 'IND' | 'NDA' | 'BLA' | 'ANDA' | 'sNDA' | 'sBLA';
    applicant: string;
    submission_date: string;
    modules: Record<string, ECTDModule>;
    completeness_score: number;
    missing_sections: string[];
    total_sections: number;
    completed_sections: number;
  };
}

export interface ModuleIndexEntry {
  moduleId: string;
  moduleTitle: string;
  sectionId: string;
  sectionTitle: string;
  status: ECTDSectionStatus;
  sourceAgent: string;
  lastUpdated: string;
}

export interface CompletenessReport {
  timestamp: string;
  score: number;
  totalRequired: number;
  complete: number;
  draft: number;
  missing: number;
  notApplicable: number;
  missingSections: Array<{ sectionId: string; title: string; moduleId: string }>;
  readyForSubmission: boolean;
}

// ---------------------------------------------------------------------------
// eCTD Module Definitions (ICH M4 structure)
// ---------------------------------------------------------------------------

interface ModuleTemplate {
  id: string;
  title: string;
  sections: Array<{ id: string; title: string; required: boolean }>;
}

const ECTD_MODULE_TEMPLATES: ModuleTemplate[] = [
  {
    id: 'm1',
    title: 'Module 1 — Administrative Information and Prescribing Information',
    sections: [
      { id: 'm1-2', title: 'Cover Letter', required: true },
      { id: 'm1-3', title: 'Administrative Information', required: true },
      { id: 'm1-14', title: 'Labeling', required: false },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2 — Common Technical Document Summaries',
    sections: [
      { id: 'm2-2', title: 'Introduction', required: true },
      { id: 'm2-3', title: 'Quality Overall Summary', required: true },
      { id: 'm2-4', title: 'Nonclinical Overview', required: true },
      { id: 'm2-5', title: 'Clinical Overview', required: true },
      { id: 'm2-6', title: 'Nonclinical Written and Tabulated Summaries', required: true },
      { id: 'm2-7', title: 'Clinical Summary', required: true },
      { id: 'm2-7-1', title: 'Summary of Biopharmaceutic Studies', required: false },
      { id: 'm2-7-2', title: 'Summary of Clinical Pharmacology Studies', required: false },
      { id: 'm2-7-3', title: 'Summary of Clinical Efficacy', required: true },
      { id: 'm2-7-4', title: 'Summary of Clinical Safety', required: true },
    ],
  },
  {
    id: 'm3',
    title: 'Module 3 — Quality',
    sections: [
      { id: 'm3-2-s', title: 'Drug Substance', required: true },
      { id: 'm3-2-p', title: 'Drug Product', required: true },
      { id: 'm3-2-a', title: 'Appendices', required: false },
      { id: 'm3-2-r', title: 'Regional Information', required: false },
    ],
  },
  {
    id: 'm4',
    title: 'Module 4 — Nonclinical Study Reports',
    sections: [
      { id: 'm4-2-1', title: 'Pharmacology', required: true },
      { id: 'm4-2-2', title: 'Pharmacokinetics', required: true },
      { id: 'm4-2-3', title: 'Toxicology', required: true },
    ],
  },
  {
    id: 'm5',
    title: 'Module 5 — Clinical Study Reports',
    sections: [
      { id: 'm5-2', title: 'Tabular Listing of All Clinical Studies', required: true },
      { id: 'm5-3-1', title: 'Reports of Biopharmaceutic Studies', required: false },
      { id: 'm5-3-2', title: 'Reports of Human PK Studies', required: false },
      { id: 'm5-3-3', title: 'Reports of Human PD Studies', required: false },
      { id: 'm5-3-4', title: 'Reports of Efficacy and Safety Studies', required: true },
      { id: 'm5-3-5-1', title: 'Reports of Controlled Clinical Studies', required: true },
      { id: 'm5-3-5-2', title: 'Reports of Uncontrolled Clinical Studies', required: false },
      { id: 'm5-3-5-3', title: 'Reports of Analyses of Data from More Than One Study', required: false },
      { id: 'm5-3-5-4', title: 'Other Clinical Study Reports', required: false },
      { id: 'm5-3-6', title: 'Post-Marketing Experience', required: false },
      { id: 'm5-3-7', title: 'Case Report Forms and Individual Patient Listings', required: false },
    ],
  },
];

/**
 * Maps well-known agent names / document types to eCTD section IDs.
 */
const AGENT_TO_SECTION_MAP: Record<string, string> = {
  // Agent names
  'Literature Scout': 'm5-3-5-1',
  'Protocol Designer': 'm5-3-1',
  'SAP Architect': 'm5-3-5-3',
  'Conflict Resolver': 'm2-7-4',
  'Regulatory Watcher': 'm1-3',
  'Patient Safety Sentinel': 'm2-7-4',

  // Document types (lower-cased for lookup)
  'evidence brief': 'm5-3-5-1',
  'evidence_brief': 'm5-3-5-1',
  'protocol': 'm5-3-1',
  'sap': 'm5-3-5-3',
  'statistical analysis plan': 'm5-3-5-3',
  'clinical overview': 'm2-5',
  'clinical summary': 'm2-7',
  'safety summary': 'm2-7-4',
  'efficacy summary': 'm2-7-3',
  'pharmacology': 'm4-2-1',
  'toxicology': 'm4-2-3',
  'labeling': 'm1-14',
  'cover letter': 'm1-2',
  'quality overall summary': 'm2-3',
  'drug substance': 'm3-2-s',
  'drug product': 'm3-2-p',
  'conflicts': 'm2-7-4',
  'adverse events': 'm2-7-4',
  'post-marketing': 'm5-3-6',
};

// ---------------------------------------------------------------------------
// ECTDCompiler
// ---------------------------------------------------------------------------

export class ECTDCompiler {
  private static instance: ECTDCompiler;

  private constructor() {
    // Singleton — private constructor.
  }

  public static getInstance(): ECTDCompiler {
    if (!ECTDCompiler.instance) {
      ECTDCompiler.instance = new ECTDCompiler();
    }
    return ECTDCompiler.instance;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Map an agent's output to the correct eCTD module / section.
   *
   * @returns An `ECTDSection` object positioned in the correct module.
   */
  public mapToModule(
    agentOutput: any,
    sourceAgent: string,
  ): { moduleId: string; section: ECTDSection } {
    const sectionId = this.resolveSectionId(sourceAgent);
    const sectionTemplate = this.findSectionTemplate(sectionId);

    const section: ECTDSection = {
      id: sectionId,
      title: sectionTemplate?.title ?? sourceAgent,
      status: agentOutput ? 'DRAFT' : 'MISSING',
      content: agentOutput ?? null,
      sourceAgent,
      lastUpdated: new Date().toISOString(),
      fileReferences: [],
    };

    const moduleId = sectionId.split('-').slice(0, 1).join('');
    // e.g. "m5-3-5-1" → "m5"

    return { moduleId, section };
  }

  /**
   * Assemble a complete eCTD submission package from agent outputs.
   */
  public compileSubmissionPackage(
    trialId: string,
    evidenceBrief: any,
    protocol: any,
    sap: any,
    conflicts: any[],
    options?: {
      submissionType?: ECTDSubmission['ectd_submission']['submission_type'];
      applicant?: string;
      sequence?: string;
    },
  ): ECTDSubmission {
    // Initialise empty modules from templates
    const modules: Record<string, ECTDModule> = {};
    for (const tpl of ECTD_MODULE_TEMPLATES) {
      const sections: Record<string, ECTDSection> = {};
      for (const sTpl of tpl.sections) {
        sections[sTpl.id] = {
          id: sTpl.id,
          title: sTpl.title,
          status: 'MISSING',
          content: null,
          sourceAgent: '',
          lastUpdated: '',
          fileReferences: [],
        };
      }
      modules[tpl.id] = {
        id: tpl.id,
        title: tpl.title,
        status: 'MISSING',
        sections,
      };
    }

    // Slot in provided content
    const slotContent = (
      content: any,
      agent: string,
      status: ECTDSectionStatus = 'DRAFT',
    ) => {
      if (!content) return;
      const { moduleId, section } = this.mapToModule(content, agent);
      section.status = status;
      const mod = modules[moduleId];
      if (mod && mod.sections[section.id]) {
        mod.sections[section.id] = section;
      }
    };

    slotContent(evidenceBrief, 'Literature Scout', 'COMPLETE');
    slotContent(protocol, 'Protocol Designer', 'COMPLETE');
    slotContent(sap, 'SAP Architect', 'COMPLETE');

    if (conflicts && conflicts.length > 0) {
      slotContent(
        { conflicts, resolution_status: 'REVIEWED' },
        'Conflict Resolver',
        'DRAFT',
      );
    }

    // Compute module-level statuses
    for (const mod of Object.values(modules)) {
      const sectionStatuses = Object.values(mod.sections).map((s) => s.status);
      if (sectionStatuses.every((s) => s === 'COMPLETE' || s === 'NOT_APPLICABLE')) {
        mod.status = 'COMPLETE';
      } else if (sectionStatuses.some((s) => s === 'COMPLETE' || s === 'DRAFT')) {
        mod.status = 'DRAFT';
      } else {
        mod.status = 'MISSING';
      }
    }

    // Collect missing required sections
    const missing: string[] = [];
    let total = 0;
    let completed = 0;

    for (const tpl of ECTD_MODULE_TEMPLATES) {
      for (const sTpl of tpl.sections) {
        if (!sTpl.required) continue;
        total++;
        const mod = modules[tpl.id];
        const sec = mod?.sections[sTpl.id];
        if (!sec || sec.status === 'MISSING') {
          missing.push(sTpl.id);
        } else if (sec.status === 'COMPLETE') {
          completed++;
        } else if (sec.status === 'DRAFT') {
          // Drafts count as 50% towards completeness
          completed += 0.5;
        }
      }
    }

    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ectd_submission: {
        sequence: options?.sequence ?? '0001',
        submission_type: options?.submissionType ?? 'IND',
        applicant: options?.applicant ?? `TrialSync/${trialId}`,
        submission_date: new Date().toISOString(),
        modules,
        completeness_score: score,
        missing_sections: missing,
        total_sections: total,
        completed_sections: Math.floor(completed),
      },
    };
  }

  /**
   * Build a flat index / manifest of all modules and sections with their
   * statuses — useful for dashboards and audit trails.
   */
  public generateModuleIndex(modules: Record<string, ECTDModule> | ECTDModule[]): ModuleIndexEntry[] {
    const index: ModuleIndexEntry[] = [];

    const moduleMap = Array.isArray(modules)
      ? Object.fromEntries(modules.map((m) => [m.id, m]))
      : modules;

    for (const mod of Object.values(moduleMap)) {
      for (const sec of Object.values(mod.sections)) {
        index.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          sectionId: sec.id,
          sectionTitle: sec.title,
          status: sec.status,
          sourceAgent: sec.sourceAgent,
          lastUpdated: sec.lastUpdated,
        });
      }
    }

    return index;
  }

  /**
   * Validate a submission package for completeness against ICH M4 requirements.
   */
  public validateCompleteness(submissionPackage: ECTDSubmission): CompletenessReport {
    const modules = submissionPackage.ectd_submission.modules;

    let totalRequired = 0;
    let complete = 0;
    let draft = 0;
    let missing = 0;
    let notApplicable = 0;
    const missingSections: CompletenessReport['missingSections'] = [];

    for (const tpl of ECTD_MODULE_TEMPLATES) {
      for (const sTpl of tpl.sections) {
        if (!sTpl.required) continue;
        totalRequired++;

        const mod = modules[tpl.id];
        const sec = mod?.sections[sTpl.id];

        if (!sec || sec.status === 'MISSING') {
          missing++;
          missingSections.push({
            sectionId: sTpl.id,
            title: sTpl.title,
            moduleId: tpl.id,
          });
        } else if (sec.status === 'COMPLETE') {
          complete++;
        } else if (sec.status === 'DRAFT') {
          draft++;
        } else if (sec.status === 'NOT_APPLICABLE') {
          notApplicable++;
        }
      }
    }

    const effectiveTotal = totalRequired - notApplicable;
    const score = effectiveTotal > 0
      ? Math.round(((complete + draft * 0.5) / effectiveTotal) * 100)
      : 100;

    return {
      timestamp: new Date().toISOString(),
      score,
      totalRequired,
      complete,
      draft,
      missing,
      notApplicable,
      missingSections,
      readyForSubmission: missing === 0 && draft === 0,
    };
  }

  /**
   * Resolve an eCTD section ID from an agent name or document type string.
   * Falls back to a generic Module 5 section when unrecognised.
   */
  public resolveSectionId(sourceAgent: string): string {
    // Try exact match first
    if (AGENT_TO_SECTION_MAP[sourceAgent]) {
      return AGENT_TO_SECTION_MAP[sourceAgent];
    }
    // Try lowercase match
    const lower = sourceAgent.toLowerCase().trim();
    if (AGENT_TO_SECTION_MAP[lower]) {
      return AGENT_TO_SECTION_MAP[lower];
    }
    // Fuzzy substring match
    for (const [key, sectionId] of Object.entries(AGENT_TO_SECTION_MAP)) {
      if (lower.includes(key.toLowerCase())) {
        return sectionId;
      }
    }
    // Default to controlled clinical studies
    return 'm5-3-5-1';
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private findSectionTemplate(
    sectionId: string,
  ): { id: string; title: string; required: boolean } | undefined {
    for (const mod of ECTD_MODULE_TEMPLATES) {
      const found = mod.sections.find((s) => s.id === sectionId);
      if (found) return found;
    }
    return undefined;
  }
}
