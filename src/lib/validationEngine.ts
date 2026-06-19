import { callAgentModel } from './models';

export interface NumericalThreshold {
  parameter: string;
  operator: '<' | '<=' | '>' | '>=' | '=' | '!=';
  value: number;
  unit: string;
  sourceText: string;
}

export interface CitationMismatch {
  parameter: string;
  protocolThreshold: NumericalThreshold;
  literatureThreshold: NumericalThreshold;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

/**
 * Advanced Validation Engine
 * Responsible for strict, math-based extraction of numerical thresholds from 
 * unstructured text, reducing hallucination in conflict detection.
 */
export class ValidationEngine {
  
  /**
   * Extracts numerical clinical thresholds (e.g., ALT < 40) from text into strict JSON.
   */
  public static async extractNumericalThresholds(text: string): Promise<NumericalThreshold[]> {
    const prompt = `
    You are a strict clinical data parser. 
    Extract all numerical thresholds (Inclusion/Exclusion criteria, lab values, baseline characteristics) from the following text.
    Return ONLY a valid JSON array of objects. Do not wrap in markdown tags.
    Format:
    [
      {
        "parameter": "ALT",
        "operator": "<",
        "value": 40,
        "unit": "U/L",
        "sourceText": "ALT must be strictly under 40 U/L"
      }
    ]
    
    Text to parse:
    ${text}
    `;

    try {
      // For this specific structural task, we use the fallback/general fast model (gemini-2.5-flash or groq)
      // Since it's a structural extraction task.
      const response = await callAgentModel({
        agentIndex: 1,
        prompt,
        jsonMode: true
      });
      // Clean potential markdown formatting
      const cleanJsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJsonStr) as NumericalThreshold[];
    } catch (error) {
      console.error('[ValidationEngine] Failed to parse thresholds:', error);
      return [];
    }
  }

  /**
   * Compares literature thresholds against drafted protocol thresholds and returns exact mismatches.
   */
  public static mapCitationsAndFindMismatches(
    literatureThresholds: NumericalThreshold[],
    protocolThresholds: NumericalThreshold[]
  ): CitationMismatch[] {
    const mismatches: CitationMismatch[] = [];

    // Group by parameter for comparison
    const litMap = new Map<string, NumericalThreshold[]>();
    for (const lit of literatureThresholds) {
      const key = lit.parameter.toLowerCase().trim();
      if (!litMap.has(key)) litMap.set(key, []);
      litMap.get(key)!.push(lit);
    }

    for (const prot of protocolThresholds) {
      const key = prot.parameter.toLowerCase().trim();
      const matchingLit = litMap.get(key);

      if (matchingLit && matchingLit.length > 0) {
        // Compare values
        for (const lit of matchingLit) {
          let hasConflict = false;
          let explanation = '';

          // Simple mismatch logic: if protocol allows > lit max, or protocol requires < lit min
          // This is a naive mathematical comparison for demonstration of the engine.
          if (prot.operator.includes('<') && lit.operator.includes('<') && prot.value > lit.value) {
            hasConflict = true;
            explanation = `Protocol permits ${prot.parameter} up to ${prot.value}, but literature strictly limits to ${lit.value}.`;
          } else if (prot.operator.includes('>') && lit.operator.includes('>') && prot.value < lit.value) {
            hasConflict = true;
            explanation = `Protocol permits ${prot.parameter} down to ${prot.value}, but literature strictly requires at least ${lit.value}.`;
          }

          if (hasConflict) {
            mismatches.push({
              parameter: prot.parameter,
              protocolThreshold: prot,
              literatureThreshold: lit,
              severity: 'HIGH',
              explanation
            });
          }
        }
      }
    }

    return mismatches;
  }
}
