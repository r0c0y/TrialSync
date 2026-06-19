import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { band } from '@/lib/band';

/**
 * NCBI E-Utilities Configuration
 * - Authenticated access allows 3 requests/second (vs 0.33/sec unauthenticated)
 * - Two API keys for failover
 * - Includes tool and email parameters per NCBI requirements
 */
const NCBI_CONFIG = {
  keys: [
    process.env.NCBI_API_KEY_1 || '',
    process.env.NCBI_API_KEY_2 || '',
  ],
  tool: 'trialsync',
  email: 'clinical@trialsync.io',
  baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  rateLimitMs: 350, // 350ms between requests = ~2.8 req/sec (safely under 3/sec limit)
  currentKeyIndex: 0,
};

function getApiKeyParam(): string {
  const key = NCBI_CONFIG.keys[NCBI_CONFIG.currentKeyIndex];
  if (!key) {
    // Try the other key
    NCBI_CONFIG.currentKeyIndex = (NCBI_CONFIG.currentKeyIndex + 1) % NCBI_CONFIG.keys.length;
    const fallbackKey = NCBI_CONFIG.keys[NCBI_CONFIG.currentKeyIndex];
    if (!fallbackKey) return '';
    return `&api_key=${fallbackKey}`;
  }
  return `&api_key=${key}`;
}

function getBaseParams(): string {
  return `&tool=${NCBI_CONFIG.tool}&email=${encodeURIComponent(NCBI_CONFIG.email)}${getApiKeyParam()}`;
}

async function rateLimitedFetch(url: string, retries = 2): Promise<Response> {
  // Rate limiting delay
  await new Promise(resolve => setTimeout(resolve, NCBI_CONFIG.rateLimitMs));

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      
      if (res.status === 429) {
        // Rate limited — switch to fallback key and retry
        console.warn(`[PubMed] Rate limited (429). Switching API key and retrying in 1s...`);
        NCBI_CONFIG.currentKeyIndex = (NCBI_CONFIG.currentKeyIndex + 1) % NCBI_CONFIG.keys.length;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      if (!res.ok && attempt < retries) {
        console.warn(`[PubMed] Request failed (${res.status}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      return res;
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[PubMed] Network error, retrying...`, err);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      throw err;
    }
  }
  
  throw new Error('All NCBI API retry attempts exhausted');
}

export async function POST(req: Request) {
  try {
    const { trialId, query } = await req.json();

    if (!trialId || !query) {
      return NextResponse.json({ error: 'Trial ID and search query are required.' }, { status: 400 });
    }

    const trial = await db.getTrial(trialId);
    if (!trial) {
      return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
    }

    console.log(`[PubMed] Authenticated search for: "${query}"`);

    // ─── Step 1: Search PubMed (up to 10 articles) ──────────────
    const searchUrl = `${NCBI_CONFIG.baseUrl}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=10&sort=relevance${getBaseParams()}`;
    const searchRes = await rateLimitedFetch(searchUrl);
    if (!searchRes.ok) {
      throw new Error(`PubMed Search API returned ${searchRes.status}`);
    }

    const searchJson = await searchRes.json();
    const idList: string[] = searchJson.esearchresult?.idlist || [];
    const totalCount = parseInt(searchJson.esearchresult?.count || '0', 10);

    if (idList.length === 0) {
      return NextResponse.json({ success: true, count: 0, totalAvailable: totalCount, message: 'No articles found matching query.' });
    }

    console.log(`[PubMed] Found ${totalCount} total articles. Fetching top ${idList.length} with full metadata...`);

    // ─── Step 2: Batch fetch summaries (single API call for all IDs) ──
    const allIds = idList.join(',');
    const summaryUrl = `${NCBI_CONFIG.baseUrl}/esummary.fcgi?db=pubmed&id=${allIds}&retmode=json${getBaseParams()}`;
    const sumRes = await rateLimitedFetch(summaryUrl);
    let summaryData: Record<string, any> = {};
    if (sumRes.ok) {
      const sumJson = await sumRes.json();
      summaryData = sumJson.result || {};
    }

    // ─── Step 3: Batch fetch abstracts (single API call) ────────
    const abstractUrl = `${NCBI_CONFIG.baseUrl}/efetch.fcgi?db=pubmed&id=${allIds}&retmode=xml${getBaseParams()}`;
    const abstractRes = await rateLimitedFetch(abstractUrl);
    let rawAbstractXml = '';
    if (abstractRes.ok) {
      rawAbstractXml = await abstractRes.text();
    }

    // ─── Step 4: Fetch MeSH terms for structured indexing ───────
    const medlineUrl = `${NCBI_CONFIG.baseUrl}/efetch.fcgi?db=pubmed&id=${allIds}&rettype=medline&retmode=text${getBaseParams()}`;
    const medlineRes = await rateLimitedFetch(medlineUrl);
    let medlineText = '';
    if (medlineRes.ok) {
      medlineText = await medlineRes.text();
    }

    // Parse MeSH terms from MEDLINE format
    const meshByPmid: Record<string, string[]> = {};
    if (medlineText) {
      const records = medlineText.split(/\nPMID-\s*/);
      for (const record of records) {
        const pmidMatch = record.match(/^(\d+)/);
        if (pmidMatch) {
          const pmid = pmidMatch[1];
          const meshTerms: string[] = [];
          const meshMatches = record.matchAll(/MH\s+-\s+(.+)/g);
          for (const m of meshMatches) {
            meshTerms.push(m[1].trim());
          }
          meshByPmid[pmid] = meshTerms;
        }
      }
    }

    // ─── Step 5: Process each article ───────────────────────────
    const importedDocs = [];

    for (const pmid of idList) {
      try {
        const docInfo = summaryData[pmid] || {};
        const title = docInfo.title || `PubMed Article (PMID: ${pmid})`;
        const source = docInfo.source || 'NCBI PubMed';
        const pubDate = docInfo.pubdate || 'Unknown';
        const authors = (docInfo.authors || []).map((a: any) => a.name).join(', ');
        const doi = docInfo.elocationid || '';
        const pubType = (docInfo.pubtype || []).join(', ');

        // Extract abstract from XML
        let abstractText = '';
        if (rawAbstractXml) {
          const abstractRegex = new RegExp(
            `<PubmedArticle>(?:(?!<\\/PubmedArticle>)[\\s\\S])*?<PMID[^>]*>${pmid}<\\/PMID>[\\s\\S]*?<AbstractText[^>]*>([\\s\\S]*?)<\\/AbstractText>`,
            'g'
          );
          const matches = rawAbstractXml.matchAll(abstractRegex);
          const parts: string[] = [];
          for (const match of matches) {
            parts.push(match[1].replace(/<[^>]+>/g, '').trim());
          }
          abstractText = parts.join('\n\n') || `No abstract available for PMID: ${pmid}`;
        }

        // If XML parsing missed it, fallback to per-article fetch
        if (!abstractText || abstractText.includes('No abstract available')) {
          const fetchUrl = `${NCBI_CONFIG.baseUrl}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=abstract${getBaseParams()}`;
          const fetchRes = await rateLimitedFetch(fetchUrl);
          if (fetchRes.ok) {
            abstractText = await fetchRes.text();
          }
        }

        const meshTerms = meshByPmid[pmid] || [];
        const meshSection = meshTerms.length > 0
          ? `\n\n## MeSH Terms\n${meshTerms.map(t => `- ${t}`).join('\n')}`
          : '';

        // Build rich document content
        const richContent = [
          `# ${title}`,
          '',
          `**PMID:** ${pmid}`,
          `**Journal:** ${source}`,
          `**Published:** ${pubDate}`,
          `**Authors:** ${authors || 'Not available'}`,
          doi ? `**DOI:** ${doi}` : '',
          pubType ? `**Publication Type:** ${pubType}` : '',
          '',
          '## Abstract',
          abstractText,
          meshSection,
          '',
          `---`,
          `*Source: NCBI PubMed (Authenticated API) | Fetched by TrialSync Literature Pipeline*`
        ].filter(Boolean).join('\n');

        const docId = `DOC-PMID-${pmid}`;
        const hash = `SHA-PMID-${pmid}-${Date.now()}`;

        await db.createDocument(
          docId,
          trialId,
          `PubMed: ${title.substring(0, 100)}${title.length > 100 ? '...' : ''}`,
          richContent,
          'LITERATURE',
          hash
        );

        importedDocs.push({
          id: docId,
          title: title.substring(0, 120),
          pmid,
          journal: source,
          pubDate,
          authors: authors.substring(0, 200),
          meshTermCount: meshTerms.length
        });

        await logAuditTrail(
          trialId,
          'DOCUMENT_INGEST',
          'clinical_lead@pharmacompany.com',
          'Clinical Program Lead',
          'Literature Database',
          `Imported PubMed article: "${title.substring(0, 80)}" (PMID: ${pmid}, ${meshTerms.length} MeSH terms)`,
          'NCBI E-Utilities authenticated API fetch with MeSH enrichment.'
        );

      } catch (err: any) {
        console.error(`[PubMed] Failed to process PMID ${pmid}:`, err.message);
      }
    }

    // ─── Step 6: Notify Band Room ───────────────────────────────
    try {
      if (trial.band_room_id) {
        const meshTotal = importedDocs.reduce((acc, d) => acc + d.meshTermCount, 0);
        await band.sendMessage(
          trialId,
          trial.band_room_id,
          'PubMed Literature Engine',
          `Ingested ${importedDocs.length}/${totalCount} articles for "${query}". Extracted ${meshTotal} MeSH terms for structured indexing. Top articles: ${importedDocs.slice(0, 3).map(d => d.title.substring(0, 50)).join('; ')}`
        );
      }
    } catch (err) {
      console.error('[PubMed] Error notifying Band:', err);
    }

    return NextResponse.json({
      success: true,
      count: importedDocs.length,
      totalAvailable: totalCount,
      documents: importedDocs
    });

  } catch (err: any) {
    console.error('[PubMed] Fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
