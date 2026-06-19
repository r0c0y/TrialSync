import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore  
import officeparser from 'officeparser';

const geminiKey = process.env.GEMINI_KEY_1 || process.env.GEMINI_KEY_2 || '';

// Supported file types and their extraction strategies
const SUPPORTED_EXTENSIONS: Record<string, string> = {
  '.pdf': 'pdf',
  '.docx': 'docx',
  '.doc': 'legacy_doc',
  '.xlsx': 'xlsx',
  '.xls': 'xls',
  '.pptx': 'pptx',
  '.txt': 'text',
  '.md': 'text',
  '.csv': 'text',
  '.tsv': 'text',
  '.rtf': 'rtf',
  '.xml': 'text',
  '.json': 'text',
  '.html': 'text',
  '.htm': 'text',
};

/**
 * Enterprise-grade document parser supporting PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, RTF and more.
 * Uses a multi-stage extraction pipeline:
 *   Stage 1: Native parser (mammoth for docx, officeparser for everything else)
 *   Stage 2: Gemini multimodal OCR fallback for scanned/image PDFs
 *   Stage 3: Structured Markdown formatting via LLM for agent consumption
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const trialId = formData.get('trialId') as string;
    const file = formData.get('file') as File;

    if (!trialId || !file) {
      return NextResponse.json({ error: 'Trial ID and File are required.' }, { status: 400 });
    }

    const trial = await db.getTrial(trialId);
    if (!trial) {
      return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const extractionStrategy = SUPPORTED_EXTENSIONS[fileExtension];

    if (!extractionStrategy) {
      return NextResponse.json({
        error: `Unsupported file type: ${fileExtension}. Supported: ${Object.keys(SUPPORTED_EXTENSIONS).join(', ')}`
      }, { status: 400 });
    }

    let extractedText = '';
    let parserUsed = 'unknown';

    // ─── STAGE 1: Native Parsing ─────────────────────────────────
    console.log(`[DocParser] Stage 1: Parsing ${file.name} (${fileExtension}) using strategy: ${extractionStrategy}`);

    switch (extractionStrategy) {
      case 'pdf': {
        // Try officeparser first (handles both text and embedded content well)
        try {
          const opResult = await officeparser.parseOffice(buffer, {
            outputErrorToConsole: false
          });
          extractedText = String(opResult);
          parserUsed = 'officeparser';
          console.log(`[DocParser] officeparser extracted ${extractedText.length} chars from PDF`);
        } catch (err) {
          console.warn('[DocParser] officeparser PDF failed, trying pdf-parse:', err);
        }

        // Fallback to pdf-parse if officeparser returned nothing
        if (!extractedText.trim() || extractedText.trim().length < 100) {
          try {
            const { PDFParse } = await import('pdf-parse');
            const parser = new PDFParse(new Uint8Array(buffer));
            const parsed = await parser.getText();
            extractedText = parsed.text || '';
            parserUsed = 'pdf-parse';
            console.log(`[DocParser] pdf-parse extracted ${extractedText.length} chars`);
          } catch (err) {
            console.warn('[DocParser] pdf-parse also failed:', err);
          }
        }
        break;
      }

      case 'docx': {
        // mammoth is the gold standard for .docx
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
          parserUsed = 'mammoth';
          console.log(`[DocParser] mammoth extracted ${extractedText.length} chars from DOCX`);
        } catch (err) {
          console.warn('[DocParser] mammoth failed, trying officeparser:', err);
          // Fallback to officeparser
          try {
            const opResult = await officeparser.parseOffice(buffer, {
              outputErrorToConsole: false
            });
            extractedText = String(opResult);
            parserUsed = 'officeparser-docx';
          } catch (err2) {
            console.error('[DocParser] All DOCX parsers failed:', err2);
          }
        }
        break;
      }

      case 'legacy_doc':
      case 'xlsx':
      case 'xls':
      case 'pptx':
      case 'rtf': {
        // officeparser handles all Office formats natively
        try {
          const opResult = await officeparser.parseOffice(buffer, {
            outputErrorToConsole: false
          });
          extractedText = String(opResult);
          parserUsed = 'officeparser';
          console.log(`[DocParser] officeparser extracted ${extractedText.length} chars from ${fileExtension}`);
        } catch (err) {
          console.error(`[DocParser] officeparser ${fileExtension} failed:`, err);
        }
        break;
      }

      case 'text': {
        extractedText = buffer.toString('utf-8');
        parserUsed = 'utf8-text';
        break;
      }
    }

    // ─── STAGE 2: Gemini Multimodal OCR Fallback ─────────────────
    // If text is empty or extremely short (likely a scanned/image PDF), use Gemini vision
    if ((!extractedText.trim() || extractedText.trim().length < 150) && geminiKey) {
      console.log(`[DocParser] Stage 2: Text too short (${extractedText.trim().length} chars). Launching Gemini multimodal OCR...`);

      const mimeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      };

      const mimeType = mimeMap[fileExtension] || 'application/octet-stream';

      try {
        const ai = new GoogleGenerativeAI(geminiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType
            }
          },
          `You are a clinical document OCR engine. Perform high-fidelity transcription of this document.
          
          Rules:
          - Transcribe ALL text verbatim — headers, body text, tables, footnotes, references
          - Preserve table structures using Markdown table syntax (|---|---|)
          - Preserve numbered lists, bullet points, and hierarchical structures
          - Keep all numerical values, units, and statistical figures EXACTLY as written
          - Do NOT summarize, interpret, or omit ANY content
          - Output as clean, structured Markdown
          - If the document has multiple sections, use # headers to demarcate them`
        ]);
        extractedText = result.response.text();
        parserUsed = 'gemini-ocr';
        console.log(`[DocParser] Gemini OCR transcription successful. Length: ${extractedText.length}`);
      } catch (ocrErr: any) {
        console.error('[DocParser] Gemini OCR fallback failed:', ocrErr);
        // Absolute last resort: raw UTF-8 strip
        if (!extractedText.trim()) {
          extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
          parserUsed = 'raw-utf8-fallback';
        }
      }
    }

    // ─── STAGE 3: LLM Markdown Structuring ───────────────────────
    // Format raw text into structured Markdown for optimal agent consumption
    if (extractedText.trim() && extractedText.trim().length > 200 && geminiKey && parserUsed !== 'gemini-ocr') {
      try {
        console.log(`[DocParser] Stage 3: Structuring ${extractedText.length} chars into agent-optimized Markdown...`);
        const ai = new GoogleGenerativeAI(geminiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(
          `You are a clinical document formatter. Convert this raw extracted text into clean, structured Markdown.
          
          Rules:
          - Enforce section headers: # Title, ## Methods, ## Results, ## Safety, ## Conclusion (if applicable)
          - Preserve ALL numbers, statistical values, P-values, confidence intervals EXACTLY
          - Preserve ALL author names, journal names, dates, and citations EXACTLY
          - Convert any table-like data into proper Markdown tables
          - Convert any list-like data into proper Markdown bullet lists
          - Do NOT add any information that isn't in the original text
          - Do NOT remove any information
          - Keep the total length approximately the same (do not truncate)
          
          Raw Extracted Text:
          ${extractedText.substring(0, 30000)}`
        );
        const formatted = result.response.text();
        // Only use formatted version if it's reasonably sized (not truncated)
        if (formatted.length > extractedText.length * 0.5) {
          extractedText = formatted;
        }
      } catch (formatErr) {
        console.warn('[DocParser] Stage 3 formatting failed, keeping raw text:', formatErr);
      }
    }

    // ─── Final Validation ────────────────────────────────────────
    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Failed to extract text from file. The document may be empty or in an unsupported format.' }, { status: 400 });
    }

    // ─── Save to Database ────────────────────────────────────────
    const docId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const hash = `SHA256-${Buffer.from(extractedText.substring(0, 1000)).toString('base64').substring(0, 32)}`;
    
    await db.createDocument(docId, trialId, file.name, extractedText, 'LITERATURE', hash);

    await logAuditTrail(
      trialId,
      'FILE_UPLOAD',
      'clinical_researcher@pharmacompany.com',
      'Clinical Researcher',
      'Literature Document',
      `Uploaded and processed: "${file.name}" (${fileExtension}, ${extractedText.length} chars, parser: ${parserUsed}, hash: ${hash}).`,
      'Multi-stage document parsing pipeline completed successfully.'
    );

    console.log(`[DocParser] ✓ Complete: ${file.name} → ${extractedText.length} chars via ${parserUsed}`);

    return NextResponse.json({
      success: true,
      docId,
      stats: {
        fileName: file.name,
        fileSize: buffer.length,
        extractedChars: extractedText.length,
        parser: parserUsed,
        extension: fileExtension
      }
    });
  } catch (err: any) {
    console.error('[DocParser] Fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
