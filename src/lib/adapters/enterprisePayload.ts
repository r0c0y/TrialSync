/**
 * Enterprise Payload Formatter — Enterprise Adapter
 *
 * Standardises all inter-agent messages into auditable, tamper-evident
 * enterprise payloads. Every payload is automatically enriched with:
 *   • CDISC mappings for any detected lab parameters
 *   • eCTD section targeting based on the source/target agent
 *   • SHA-256 audit hashes for regulatory-grade tamper detection
 *
 * This is the single gateway through which every agent hand-off should flow.
 */

import { createHash } from 'crypto';
import { CDISCEncoder, SDTMLBRecord } from './cdiscEncoder';
import { ECTDCompiler } from './ectdCompiler';

// ---------------------------------------------------------------------------
// Payload Interfaces
// ---------------------------------------------------------------------------

export interface CDISCMapping {
  parameters_detected: string[];
  encoded_records: SDTMLBRecord[];
  compliance_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NO_LAB_DATA';
}

export interface EnterprisePayloadEnvelope {
  enterprise_payload: {
    protocol_id: string;
    source_agent: string;
    target_agent: string;
    cdisc_mapping: CDISCMapping;
    ectd_target_section: string;
    ectd_section_title: string;
    compliance_status: 'VERIFIED_BY_ADAPTER' | 'UNVERIFIED' | 'FAILED';
    timestamp: string;
    audit_hash: string;
    payload_version: string;
    data: any;
  };
}

export interface AuditablePayload {
  data: any;
  metadata: {
    created_at: string;
    audit_hash: string;
    hash_algorithm: 'SHA-256';
    payload_size_bytes: number;
  };
}

export interface IntegrityResult {
  valid: boolean;
  expected_hash: string;
  actual_hash: string;
  checked_at: string;
}

// ---------------------------------------------------------------------------
// Lab parameter detection regex
// ---------------------------------------------------------------------------

/**
 * Well-known lab parameter names used for automatic CDISC enrichment.
 * Order matters — longest match first to avoid partial matches.
 */
const LAB_PARAMETER_PATTERNS: string[] = [
  'EGFR', 'eGFR',
  'CREAT', 'CREATININE',
  'ALT', 'AST',
  'ALB', 'ALBUMIN',
  'BILI', 'BILIRUBIN',
  'HGB', 'HEMOGLOBIN',
  'WBC',
  'PLT', 'PLATELET', 'PLATELETS',
  'CRP',
  'GFR',
  'GLUC', 'GLUCOSE',
];

// ---------------------------------------------------------------------------
// EnterprisePayload
// ---------------------------------------------------------------------------

export class EnterprisePayload {
  private static instance: EnterprisePayload;

  private readonly cdiscEncoder: CDISCEncoder;
  private readonly ectdCompiler: ECTDCompiler;

  private constructor() {
    this.cdiscEncoder = CDISCEncoder.getInstance();
    this.ectdCompiler = ECTDCompiler.getInstance();
  }

  public static getInstance(): EnterprisePayload {
    if (!EnterprisePayload.instance) {
      EnterprisePayload.instance = new EnterprisePayload();
    }
    return EnterprisePayload.instance;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Wrap any agent output into the full enterprise payload format.
   *
   * Automatically:
   *   1. Detects lab parameters in the data and encodes them via CDISCEncoder
   *   2. Resolves the eCTD target section via ECTDCompiler
   *   3. Computes a SHA-256 audit hash for tamper detection
   */
  public formatAgentHandoff(
    fromAgent: string,
    toAgent: string,
    data: any,
    trialId: string,
  ): EnterprisePayloadEnvelope {
    // 1. CDISC auto-mapping
    const cdiscMapping = this.extractCDISCMappings(data);

    // 2. eCTD section resolution
    const ectdSectionId = this.ectdCompiler.resolveSectionId(fromAgent);
    const { section } = this.ectdCompiler.mapToModule(data, fromAgent);

    // 3. Compliance determination
    let complianceStatus: EnterprisePayloadEnvelope['enterprise_payload']['compliance_status'] = 'VERIFIED_BY_ADAPTER';
    if (cdiscMapping.compliance_status === 'NON_COMPLIANT') {
      complianceStatus = 'FAILED';
    } else if (cdiscMapping.compliance_status === 'PARTIAL') {
      complianceStatus = 'UNVERIFIED';
    }

    // 4. Construct the canonical payload body (without hash) for hashing
    const payloadBody = {
      protocol_id: trialId,
      source_agent: fromAgent,
      target_agent: toAgent,
      cdisc_mapping: cdiscMapping,
      ectd_target_section: ectdSectionId,
      ectd_section_title: section.title,
      compliance_status: complianceStatus,
      timestamp: new Date().toISOString(),
      audit_hash: '', // placeholder — filled after hashing
      payload_version: '1.0.0',
      data,
    };

    // 5. Compute audit hash over the entire payload (excluding the hash field itself)
    payloadBody.audit_hash = this.computeHash(payloadBody);

    return { enterprise_payload: payloadBody };
  }

  /**
   * Create a generic auditable wrapper around any piece of data.
   * Useful for non-handoff payloads that still need tamper evidence.
   */
  public createAuditablePayload(data: any): AuditablePayload {
    const serialised = this.canonicalise(data);
    const hash = this.sha256(serialised);

    return {
      data,
      metadata: {
        created_at: new Date().toISOString(),
        audit_hash: hash,
        hash_algorithm: 'SHA-256',
        payload_size_bytes: Buffer.byteLength(serialised, 'utf-8'),
      },
    };
  }

  /**
   * Verify that a payload has not been tampered with by recomputing its
   * SHA-256 hash and comparing it to the stored value.
   */
  public validatePayloadIntegrity(
    payload: EnterprisePayloadEnvelope | AuditablePayload,
  ): IntegrityResult {
    let expectedHash: string;
    let actualHash: string;

    if ('enterprise_payload' in payload) {
      expectedHash = payload.enterprise_payload.audit_hash;
      // Recompute from the payload with audit_hash blanked out
      const copy = { ...payload.enterprise_payload, audit_hash: '' };
      actualHash = this.computeHash(copy);
    } else {
      expectedHash = payload.metadata.audit_hash;
      actualHash = this.sha256(this.canonicalise(payload.data));
    }

    return {
      valid: expectedHash === actualHash,
      expected_hash: expectedHash,
      actual_hash: actualHash,
      checked_at: new Date().toISOString(),
    };
  }

  // -----------------------------------------------------------------------
  // Lab-parameter detection & CDISC enrichment
  // -----------------------------------------------------------------------

  /**
   * Walk through `data` looking for lab parameter references and encode any
   * found values through CDISCEncoder.
   */
  private extractCDISCMappings(data: any): CDISCMapping {
    const detected: string[] = [];
    const encoded: SDTMLBRecord[] = [];

    if (!data || typeof data !== 'object') {
      return {
        parameters_detected: [],
        encoded_records: [],
        compliance_status: 'NO_LAB_DATA',
      };
    }

    const text = JSON.stringify(data).toUpperCase();

    // Detect known lab parameters mentioned in the data
    for (const pattern of LAB_PARAMETER_PATTERNS) {
      if (text.includes(pattern.toUpperCase()) && !detected.includes(pattern.toUpperCase())) {
        detected.push(pattern.toUpperCase());

        // Try to find an associated numeric value
        const numericValue = this.extractNumericForParameter(data, pattern);
        const term = this.cdiscEncoder.lookupLabTerm(pattern);

        if (numericValue !== null && term) {
          encoded.push(
            this.cdiscEncoder.encodeLabParameter(
              pattern,
              numericValue.value,
              numericValue.unit || term.defaultUnit,
              numericValue.upperBound,
            ),
          );
        }
      }
    }

    // Determine compliance status
    let complianceStatus: CDISCMapping['compliance_status'] = 'NO_LAB_DATA';
    if (detected.length > 0) {
      const allResolved = detected.every((p) => this.cdiscEncoder.lookupLabTerm(p) !== undefined);
      complianceStatus = allResolved
        ? 'COMPLIANT'
        : encoded.length > 0
          ? 'PARTIAL'
          : 'NON_COMPLIANT';
    }

    return {
      parameters_detected: detected,
      encoded_records: encoded,
      compliance_status: complianceStatus,
    };
  }

  /**
   * Best-effort extraction of a numeric value associated with a lab
   * parameter from structured or semi-structured data.
   */
  private extractNumericForParameter(
    data: any,
    parameter: string,
  ): { value: number; unit?: string; upperBound?: number } | null {
    if (!data || typeof data !== 'object') return null;

    const flat = this.flattenObject(data);
    const paramLower = parameter.toLowerCase();

    for (const [key, val] of Object.entries(flat)) {
      const keyLower = key.toLowerCase();

      if (keyLower.includes(paramLower) || keyLower.includes(parameter.toUpperCase())) {
        if (typeof val === 'number') {
          return { value: val };
        }

        if (typeof val === 'string') {
          // Try to extract "<operator> <number> <unit>" patterns
          // E.g. "ALT > 40 U/L" or "< 3 × ULN"
          const match = val.match(
            /([<>]=?|≤|≥)?\s*(\d+(?:\.\d+)?)\s*([\w/%^×·]+(?:\/[\w^]+)*)?/,
          );
          if (match) {
            const num = parseFloat(match[2]);
            const unit = match[3] || undefined;
            return { value: num, unit };
          }
        }
      }
    }

    return null;
  }

  // -----------------------------------------------------------------------
  // Hashing utilities
  // -----------------------------------------------------------------------

  /**
   * Compute a SHA-256 hash over a payload object. The `audit_hash` field
   * (if present) is excluded to avoid self-referential hashing.
   */
  private computeHash(payload: Record<string, any>): string {
    const { audit_hash: _ignored, ...rest } = payload;
    return this.sha256(this.canonicalise(rest));
  }

  private sha256(input: string): string {
    return createHash('sha256').update(input, 'utf-8').digest('hex');
  }

  /**
   * Deterministic JSON serialisation — keys are sorted to ensure the same
   * object always produces the same hash regardless of insertion order.
   */
  private canonicalise(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  // -----------------------------------------------------------------------
  // Object helpers
  // -----------------------------------------------------------------------

  /**
   * Flatten a nested object into dot-separated key paths.
   * E.g. { a: { b: 1 } } → { "a.b": 1 }
   */
  private flattenObject(
    obj: any,
    prefix = '',
    result: Record<string, any> = {},
  ): Record<string, any> {
    if (obj === null || obj === undefined) return result;

    if (Array.isArray(obj)) {
      obj.forEach((item, idx) => {
        this.flattenObject(item, `${prefix}[${idx}]`, result);
      });
      return result;
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          this.flattenObject(value, newKey, result);
        } else {
          result[newKey] = value;
        }
      }
      return result;
    }

    result[prefix] = obj;
    return result;
  }
}
