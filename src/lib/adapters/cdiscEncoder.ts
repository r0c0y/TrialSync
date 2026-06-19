/**
 * CDISC Standards Encoder — Enterprise Adapter
 *
 * Maps clinical trial data into CDISC SDTM (Study Data Tabulation Model) domain
 * records, validates compliance against controlled terminology, and generates
 * define.xml metadata structures for regulatory submissions.
 *
 * Implements the official CDISC controlled terminology codes for common laboratory
 * parameters and adverse-event severity/relationship classifications.
 */

// ---------------------------------------------------------------------------
// SDTM Domain Interfaces
// ---------------------------------------------------------------------------

/** SDTM LB — Laboratory Test Results */
export interface SDTMLBRecord {
  DOMAIN: 'LB';
  STUDYID: string;
  USUBJID: string;
  LBSEQ: number;
  LBTESTCD: string;
  LBTEST: string;
  LBCAT: string;
  LBORRES: string;
  LBORRESU: string;
  LBORNRHI: string;
  LBORNRLO: string;
  LBSTRESC: string;
  LBSTRESN: number;
  LBSTRESU: string;
  LBNRIND: 'NORMAL' | 'HIGH' | 'LOW' | '';
  LBDTC: string;
  LBDY: number | null;
}

/** SDTM DM — Demographics */
export interface SDTMDMRecord {
  DOMAIN: 'DM';
  STUDYID: string;
  USUBJID: string;
  SUBJID: string;
  RFSTDTC: string;
  RFENDTC: string;
  SITEID: string;
  AGE: number;
  AGEU: 'YEARS';
  SEX: 'M' | 'F' | 'U';
  RACE: string;
  ETHNIC: string;
  ARMCD: string;
  ARM: string;
  COUNTRY: string;
  DMDTC: string;
}

/** SDTM AE — Adverse Events */
export interface SDTMAERecord {
  DOMAIN: 'AE';
  STUDYID: string;
  USUBJID: string;
  AESEQ: number;
  AETERM: string;
  AEDECOD: string;
  AEBODSYS: string;
  AESEV: 'MILD' | 'MODERATE' | 'SEVERE';
  AESER: 'Y' | 'N';
  AEREL: 'RELATED' | 'NOT RELATED' | 'POSSIBLY RELATED';
  AEACN: string;
  AEOUT: string;
  AESTDTC: string;
  AEENDTC: string;
  AESTDY: number | null;
  AEENDY: number | null;
}

/** SDTM DS — Disposition */
export interface SDTMDSRecord {
  DOMAIN: 'DS';
  STUDYID: string;
  USUBJID: string;
  DSSEQ: number;
  DSTERM: string;
  DSDECOD: string;
  DSCAT: string;
  DSSCAT: string;
  DSSTDTC: string;
  DSDY: number | null;
}

// ---------------------------------------------------------------------------
// CDISC Controlled-Terminology Maps
// ---------------------------------------------------------------------------

export interface CDISCLabTerm {
  LBTESTCD: string;
  LBTEST: string;
  LBCAT: string;
  defaultUnit: string;
}

/**
 * Official CDISC CT codes for common laboratory analytes.
 * Key = commonly used abbreviation (case-insensitive match).
 */
const CDISC_LAB_TERMINOLOGY: Record<string, CDISCLabTerm> = {
  ALT: {
    LBTESTCD: 'ALT',
    LBTEST: 'Alanine Aminotransferase',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'U/L',
  },
  AST: {
    LBTESTCD: 'AST',
    LBTEST: 'Aspartate Aminotransferase',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'U/L',
  },
  EGFR: {
    LBTESTCD: 'GFR',
    LBTEST: 'Glomerular Filtration Rate',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'mL/min/1.73m2',
  },
  GFR: {
    LBTESTCD: 'GFR',
    LBTEST: 'Glomerular Filtration Rate',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'mL/min/1.73m2',
  },
  CREAT: {
    LBTESTCD: 'CREAT',
    LBTEST: 'Creatinine',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'mg/dL',
  },
  ALB: {
    LBTESTCD: 'ALB',
    LBTEST: 'Albumin',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'g/dL',
  },
  BILI: {
    LBTESTCD: 'BILI',
    LBTEST: 'Bilirubin',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'mg/dL',
  },
  HGB: {
    LBTESTCD: 'HGB',
    LBTEST: 'Hemoglobin',
    LBCAT: 'HEMATOLOGY',
    defaultUnit: 'g/dL',
  },
  WBC: {
    LBTESTCD: 'WBC',
    LBTEST: 'Leukocytes',
    LBCAT: 'HEMATOLOGY',
    defaultUnit: '10^9/L',
  },
  PLT: {
    LBTESTCD: 'PLAT',
    LBTEST: 'Platelets',
    LBCAT: 'HEMATOLOGY',
    defaultUnit: '10^9/L',
  },
  CRP: {
    LBTESTCD: 'CRP',
    LBTEST: 'C-Reactive Protein',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'mg/L',
  },
  GLUC: {
    LBTESTCD: 'GLUC',
    LBTEST: 'Glucose',
    LBCAT: 'CHEMISTRY',
    defaultUnit: 'mg/dL',
  },
};

/** CDISC-controlled severity terms for adverse events. */
const CDISC_AE_SEVERITY: Record<string, 'MILD' | 'MODERATE' | 'SEVERE'> = {
  MILD: 'MILD',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
  '1': 'MILD',
  '2': 'MODERATE',
  '3': 'SEVERE',
  GRADE1: 'MILD',
  GRADE2: 'MODERATE',
  GRADE3: 'SEVERE',
};

/** Required variables per SDTM domain for compliance checks. */
const SDTM_REQUIRED_VARIABLES: Record<string, string[]> = {
  DM: ['STUDYID', 'USUBJID', 'SUBJID', 'AGE', 'SEX', 'ARMCD', 'ARM', 'COUNTRY'],
  LB: ['STUDYID', 'USUBJID', 'LBSEQ', 'LBTESTCD', 'LBTEST', 'LBORRES', 'LBORRESU', 'LBDTC'],
  AE: ['STUDYID', 'USUBJID', 'AESEQ', 'AETERM', 'AEDECOD', 'AESEV', 'AESER', 'AESTDTC'],
  DS: ['STUDYID', 'USUBJID', 'DSSEQ', 'DSTERM', 'DSDECOD', 'DSSTDTC'],
};

// ---------------------------------------------------------------------------
// Compliance Report Types
// ---------------------------------------------------------------------------

export interface ComplianceIssue {
  domain: string;
  variable: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  suggestion: string;
}

export interface ComplianceReport {
  timestamp: string;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  compliant: boolean;
  issues: ComplianceIssue[];
}

export interface DefineXMLMetadata {
  defineVersion: string;
  studyOID: string;
  metadataVersionOID: string;
  creationDateTime: string;
  domains: DefineXMLDomain[];
}

export interface DefineXMLDomain {
  OID: string;
  name: string;
  label: string;
  structure: string;
  purpose: 'Tabulation';
  variables: DefineXMLVariable[];
}

export interface DefineXMLVariable {
  OID: string;
  name: string;
  label: string;
  dataType: 'text' | 'integer' | 'float' | 'date' | 'datetime';
  length: number;
  mandatory: boolean;
  codeListOID?: string;
}

// ---------------------------------------------------------------------------
// Sequence Counter (module-scoped, monotonically increasing)
// ---------------------------------------------------------------------------

let sequenceCounter = 0;
function nextSequence(): number {
  return ++sequenceCounter;
}

// ---------------------------------------------------------------------------
// CDISCEncoder
// ---------------------------------------------------------------------------

export class CDISCEncoder {
  private static instance: CDISCEncoder;

  private constructor() {
    // Singleton — private constructor.
  }

  public static getInstance(): CDISCEncoder {
    if (!CDISCEncoder.instance) {
      CDISCEncoder.instance = new CDISCEncoder();
    }
    return CDISCEncoder.instance;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Look up controlled terminology for a lab parameter.
   * Returns `undefined` when the parameter is not in the built-in dictionary.
   */
  public lookupLabTerm(parameter: string): CDISCLabTerm | undefined {
    return CDISC_LAB_TERMINOLOGY[parameter.toUpperCase().replace(/\s+/g, '')];
  }

  /**
   * Encode a lab result into an SDTM LB domain record.
   */
  public encodeLabParameter(
    parameter: string,
    value: number,
    unit: string,
    upperBound?: number,
    options?: {
      studyId?: string;
      subjectId?: string;
      lowerBound?: number;
      dateTime?: string;
      studyDay?: number | null;
    },
  ): SDTMLBRecord {
    const term = this.lookupLabTerm(parameter);
    const testCode = term?.LBTESTCD ?? parameter.toUpperCase();
    const testName = term?.LBTEST ?? parameter;
    const category = term?.LBCAT ?? 'UNCLASSIFIED';
    const normalizedUnit = unit || term?.defaultUnit || '';

    let nrind: SDTMLBRecord['LBNRIND'] = '';
    if (upperBound !== undefined) {
      if (value > upperBound) nrind = 'HIGH';
      else if (options?.lowerBound !== undefined && value < options.lowerBound) nrind = 'LOW';
      else nrind = 'NORMAL';
    }

    return {
      DOMAIN: 'LB',
      STUDYID: options?.studyId ?? '',
      USUBJID: options?.subjectId ?? '',
      LBSEQ: nextSequence(),
      LBTESTCD: testCode,
      LBTEST: testName,
      LBCAT: category,
      LBORRES: String(value),
      LBORRESU: normalizedUnit,
      LBORNRHI: upperBound !== undefined ? String(upperBound) : '',
      LBORNRLO: options?.lowerBound !== undefined ? String(options.lowerBound) : '',
      LBSTRESC: String(value),
      LBSTRESN: value,
      LBSTRESU: normalizedUnit,
      LBNRIND: nrind,
      LBDTC: options?.dateTime ?? new Date().toISOString(),
      LBDY: options?.studyDay ?? null,
    };
  }

  /**
   * Encode an adverse event into an SDTM AE domain record.
   */
  public encodeAdverseEvent(
    term: string,
    severity: string,
    serious: boolean,
    related: boolean,
    options?: {
      studyId?: string;
      subjectId?: string;
      bodySystem?: string;
      action?: string;
      outcome?: string;
      startDate?: string;
      endDate?: string;
      startDay?: number | null;
      endDay?: number | null;
    },
  ): SDTMAERecord {
    const normalizedSeverity =
      CDISC_AE_SEVERITY[severity.toUpperCase().replace(/\s+/g, '')] ?? 'MODERATE';

    return {
      DOMAIN: 'AE',
      STUDYID: options?.studyId ?? '',
      USUBJID: options?.subjectId ?? '',
      AESEQ: nextSequence(),
      AETERM: term.toUpperCase(),
      AEDECOD: term.toUpperCase(),
      AEBODSYS: options?.bodySystem ?? '',
      AESEV: normalizedSeverity,
      AESER: serious ? 'Y' : 'N',
      AEREL: related ? 'RELATED' : 'NOT RELATED',
      AEACN: options?.action ?? '',
      AEOUT: options?.outcome ?? '',
      AESTDTC: options?.startDate ?? new Date().toISOString(),
      AEENDTC: options?.endDate ?? '',
      AESTDY: options?.startDay ?? null,
      AEENDY: options?.endDay ?? null,
    };
  }

  /**
   * Encode demographics into an SDTM DM domain record.
   */
  public encodeDemographic(
    age: number,
    sex: string,
    race: string,
    arm: string,
    options?: {
      studyId?: string;
      subjectId?: string;
      siteId?: string;
      ethnic?: string;
      country?: string;
      refStartDate?: string;
      refEndDate?: string;
    },
  ): SDTMDMRecord {
    const normalizedSex = (['M', 'F', 'U'].includes(sex.toUpperCase().charAt(0))
      ? sex.toUpperCase().charAt(0)
      : 'U') as SDTMDMRecord['SEX'];

    return {
      DOMAIN: 'DM',
      STUDYID: options?.studyId ?? '',
      USUBJID: options?.subjectId ?? '',
      SUBJID: options?.subjectId ?? '',
      RFSTDTC: options?.refStartDate ?? '',
      RFENDTC: options?.refEndDate ?? '',
      SITEID: options?.siteId ?? '',
      AGE: age,
      AGEU: 'YEARS',
      SEX: normalizedSex,
      RACE: race.toUpperCase(),
      ETHNIC: options?.ethnic ?? '',
      ARMCD: arm.toUpperCase().replace(/\s+/g, ''),
      ARM: arm,
      COUNTRY: options?.country ?? '',
      DMDTC: new Date().toISOString(),
    };
  }

  /**
   * Encode a disposition event into an SDTM DS domain record.
   */
  public encodeDisposition(
    term: string,
    decodedTerm: string,
    options?: {
      studyId?: string;
      subjectId?: string;
      category?: string;
      subCategory?: string;
      startDate?: string;
      studyDay?: number | null;
    },
  ): SDTMDSRecord {
    return {
      DOMAIN: 'DS',
      STUDYID: options?.studyId ?? '',
      USUBJID: options?.subjectId ?? '',
      DSSEQ: nextSequence(),
      DSTERM: term,
      DSDECOD: decodedTerm.toUpperCase(),
      DSCAT: options?.category ?? 'DISPOSITION EVENT',
      DSSCAT: options?.subCategory ?? '',
      DSSTDTC: options?.startDate ?? new Date().toISOString(),
      DSDY: options?.studyDay ?? null,
    };
  }

  /**
   * Scan protocol sections / domain records for CDISC compliance issues.
   */
  public validateCDISCCompliance(
    protocolSections: Record<string, any> | any[],
  ): ComplianceReport {
    const issues: ComplianceIssue[] = [];

    const sections = Array.isArray(protocolSections)
      ? protocolSections
      : [protocolSections];

    for (const section of sections) {
      if (!section || typeof section !== 'object') continue;

      const domain: string = section.DOMAIN ?? section.domain ?? '';

      // 1. Check required variables for known domains
      if (domain && SDTM_REQUIRED_VARIABLES[domain.toUpperCase()]) {
        const required = SDTM_REQUIRED_VARIABLES[domain.toUpperCase()];
        for (const varName of required) {
          if (
            section[varName] === undefined ||
            section[varName] === null ||
            section[varName] === ''
          ) {
            issues.push({
              domain: domain.toUpperCase(),
              variable: varName,
              severity: 'ERROR',
              message: `Required variable ${varName} is missing or empty in domain ${domain.toUpperCase()}.`,
              suggestion: `Provide a valid value for ${varName} per SDTM IG v3.4.`,
            });
          }
        }
      }

      // 2. Validate lab test codes against controlled terminology
      if (domain.toUpperCase() === 'LB' && section.LBTESTCD) {
        const knownCodes = Object.values(CDISC_LAB_TERMINOLOGY).map((t) => t.LBTESTCD);
        if (!knownCodes.includes(section.LBTESTCD)) {
          issues.push({
            domain: 'LB',
            variable: 'LBTESTCD',
            severity: 'WARNING',
            message: `Lab test code "${section.LBTESTCD}" is not in standard CDISC controlled terminology.`,
            suggestion: `Verify this code against CDISC CT package. Consider using one of: ${knownCodes.join(', ')}.`,
          });
        }
      }

      // 3. Validate AE severity against controlled terms
      if (domain.toUpperCase() === 'AE' && section.AESEV) {
        const validSeverities = ['MILD', 'MODERATE', 'SEVERE'];
        if (!validSeverities.includes(section.AESEV)) {
          issues.push({
            domain: 'AE',
            variable: 'AESEV',
            severity: 'ERROR',
            message: `AE severity "${section.AESEV}" is not a valid CDISC controlled term.`,
            suggestion: `Use one of: ${validSeverities.join(', ')}.`,
          });
        }
      }

      // 4. Validate AE seriousness flag
      if (domain.toUpperCase() === 'AE' && section.AESER) {
        if (!['Y', 'N'].includes(section.AESER)) {
          issues.push({
            domain: 'AE',
            variable: 'AESER',
            severity: 'ERROR',
            message: `AESER value "${section.AESER}" must be "Y" or "N".`,
            suggestion: 'Set AESER to "Y" for serious AEs, "N" otherwise.',
          });
        }
      }

      // 5. Validate date-time format (ISO 8601)
      const dateVars = ['LBDTC', 'AESTDTC', 'AEENDTC', 'DMDTC', 'DSSTDTC', 'RFSTDTC', 'RFENDTC'];
      for (const dv of dateVars) {
        if (section[dv] && typeof section[dv] === 'string' && section[dv].length > 0) {
          const parsed = Date.parse(section[dv]);
          if (isNaN(parsed)) {
            issues.push({
              domain: domain.toUpperCase() || 'UNKNOWN',
              variable: dv,
              severity: 'WARNING',
              message: `Date variable ${dv} value "${section[dv]}" is not valid ISO 8601.`,
              suggestion: 'Use ISO 8601 format: YYYY-MM-DDThh:mm:ss or YYYY-MM-DD.',
            });
          }
        }
      }

      // 6. Validate DM sex controlled terms
      if (domain.toUpperCase() === 'DM' && section.SEX) {
        if (!['M', 'F', 'U'].includes(section.SEX)) {
          issues.push({
            domain: 'DM',
            variable: 'SEX',
            severity: 'ERROR',
            message: `SEX value "${section.SEX}" is not a valid CDISC controlled term.`,
            suggestion: 'Use one of: M (Male), F (Female), U (Unknown).',
          });
        }
      }
    }

    const errors = issues.filter((i) => i.severity === 'ERROR').length;
    const warnings = issues.filter((i) => i.severity === 'WARNING').length;
    const infoCount = issues.filter((i) => i.severity === 'INFO').length;

    return {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      errors,
      warnings,
      info: infoCount,
      compliant: errors === 0,
      issues,
    };
  }

  /**
   * Generate a simplified define.xml metadata structure (as JSON) for a set
   * of SDTM domain data. This is not raw XML — it is the structured metadata
   * that a downstream XML serialiser would consume.
   */
  public generateDefineXML(
    domains: Array<{ name: string; label: string; records: any[] }>,
    options?: { studyOID?: string; metadataVersionOID?: string },
  ): DefineXMLMetadata {
    const domainMeta: DefineXMLDomain[] = domains.map((d) => {
      const variables = this.inferVariables(d.records);
      return {
        OID: `IG.${d.name.toUpperCase()}`,
        name: d.name.toUpperCase(),
        label: d.label,
        structure: d.name.toUpperCase() === 'DM' ? 'One record per subject' : 'One record per record per subject',
        purpose: 'Tabulation' as const,
        variables,
      };
    });

    return {
      defineVersion: '2.1.0',
      studyOID: options?.studyOID ?? 'STUDY.TRIALSYNC',
      metadataVersionOID: options?.metadataVersionOID ?? 'MDV.TRIALSYNC.001',
      creationDateTime: new Date().toISOString(),
      domains: domainMeta,
    };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Infer define.xml variable metadata from actual records (first record used
   * for type inference).
   */
  private inferVariables(records: any[]): DefineXMLVariable[] {
    if (!records || records.length === 0) return [];

    const sample = records[0];
    const requiredDomain = sample.DOMAIN
      ? SDTM_REQUIRED_VARIABLES[sample.DOMAIN] ?? []
      : [];

    return Object.keys(sample).map((key) => {
      const val = sample[key];
      let dataType: DefineXMLVariable['dataType'] = 'text';
      let length = 200;

      if (typeof val === 'number') {
        dataType = Number.isInteger(val) ? 'integer' : 'float';
        length = 8;
      } else if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.length >= 10) {
        // Heuristic: ISO-formatted date strings
        dataType = val.includes('T') ? 'datetime' : 'date';
        length = 32;
      } else if (typeof val === 'string') {
        length = Math.max(val.length, 40);
      }

      return {
        OID: `IT.${sample.DOMAIN ?? 'XX'}.${key}`,
        name: key,
        label: key,
        dataType,
        length,
        mandatory: requiredDomain.includes(key),
      };
    });
  }
}
