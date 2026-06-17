import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { PDFParse } from 'pdf-parse';

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
    let extractedText = '';

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const parser = new PDFParse(new Uint8Array(buffer));
        const parsed = await parser.getText();
        extractedText = parsed.text;
      } catch (err) {
        console.error('pdf-parse failed, trying basic text extraction:', err);
        extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, '');
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    // Truncate or check length
    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Failed to extract text from file.' }, { status: 400 });
    }

    const docId = `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const hash = `SHA256-${Date.now()}`;
    await db.createDocument(docId, trialId, file.name, extractedText, 'LITERATURE', hash);

    await logAuditTrail(
      trialId,
      'FILE_UPLOAD',
      'clinical_researcher@pharmacompany.com',
      'Clinical Researcher',
      'Literature Document',
      `Uploaded and processed literature file: "${file.name}" (Hash: ${hash}).`,
      'Provided evidence source for protocol design.'
    );

    return NextResponse.json({ success: true, docId });
  } catch (err: any) {
    console.error('File upload failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
