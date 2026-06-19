import { GoogleGenerativeAI } from '@google/generative-ai';
import { cache } from './cache';

// Load keys from process.env
const keys = {
  gemini: [
    process.env.GEMINI_KEY_1 || '',
    process.env.GEMINI_KEY_2 || '',
    process.env.GEMINI_KEY_3 || '',
    process.env.GEMINI_KEY_4 || '',
    process.env.GEMINI_KEY_5 || '',
    process.env.GEMINI_KEY_6 || ''
  ],
  groq: [
    process.env.GROQ_KEY_1 || '',
    process.env.GROQ_KEY_2 || '',
    process.env.GROQ_KEY_3 || '',
    process.env.GROQ_KEY_4 || '',
    process.env.GROQ_KEY_5 || '',
    process.env.GROQ_KEY_6 || ''
  ]
};

export interface ModelRequest {
  agentIndex: number; // 1-based index (1 to 6)
  prompt: string;
  systemInstruction?: string;
  jsonMode?: boolean;
}

export async function callAgentModel(req: ModelRequest): Promise<string> {
  const { agentIndex, prompt, systemInstruction, jsonMode } = req;
  const idx = agentIndex - 1; // 0-based

  const geminiKey = keys.gemini[idx];
  const groqKey = keys.groq[idx];

  const cacheKey = {
    agentIndex,
    prompt: prompt.substring(0, 5000), // Limit cache key length
    systemInstruction,
    jsonMode
  };

  // 1. Check BetterDB Agent Cache (Exact Match)
  try {
    const cached = await cache.llm.check(cacheKey);
    if (cached.hit) {
      console.log(`[BetterDB Cache] Exact HIT for Agent ${agentIndex}`);
      return cached.data;
    }
  } catch (err) {
    console.error('[BetterDB Cache] Check failed:', err);
  }

  // 2. Check BetterDB Semantic Cache (Semantic Similarity Match)
  try {
    const recentQueries = await cache.semantic.getRecent(agentIndex);
    if (recentQueries.length > 0) {
      console.log(`[BetterDB Semantic Cache] Scanning ${recentQueries.length} recent queries for Agent ${agentIndex}...`);
      
      const comparisonPrompt = `
        You are a clinical semantic cache matcher.
        Compare the following "New Query" with the list of "Recent Queries".
        Determine if the "New Query" is semantically equivalent (meaning it asks for the same clinical information, same explanation, or same fix command, even if worded slightly differently) to any query in the list.
        
        New Query:
        "${prompt.substring(0, 1500)}"
        
        Recent Queries:
        ${recentQueries.map((q: any, i: number) => `${i + 1}. "${q.prompt.substring(0, 1500)}"`).join('\n')}
        
        Respond in JSON format with a boolean "matched" and the 1-based "matchedIndex" (integer, 0 if no match found).
        JSON Schema:
        {
          "matched": boolean,
          "matchedIndex": number
        }
      `;

      let checkJson: any = null;

      // Try Gemini first
      const firstGeminiKey = keys.gemini.find(k => k && k.trim().length > 5);
      if (firstGeminiKey) {
        try {
          const ai = new GoogleGenerativeAI(firstGeminiKey);
          const checkerModel = ai.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' }
          });
          const checkRes = await checkerModel.generateContent(comparisonPrompt);
          checkJson = JSON.parse(checkRes.response.text().trim());
        } catch (gemOcrErr) {
          console.warn('[BetterDB Semantic Cache] Gemini matcher failed, trying Groq fallback...');
        }
      }

      // Try Groq as fallback
      if (!checkJson) {
        const firstGroqKey = keys.groq.find(k => k && k.trim().length > 5);
        if (firstGroqKey) {
          try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firstGroqKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: comparisonPrompt }],
                response_format: { type: 'json_object' }
              })
            });
            if (res.ok) {
              const data = await res.json();
              checkJson = JSON.parse(data.choices?.[0]?.message?.content || '{}');
            }
          } catch (groqOcrErr) {
            console.warn('[BetterDB Semantic Cache] Groq matcher failed:', groqOcrErr);
          }
        }
      }

      if (checkJson && checkJson.matched && checkJson.matchedIndex > 0 && checkJson.matchedIndex <= recentQueries.length) {
        const matchedItem = recentQueries[checkJson.matchedIndex - 1];
        console.log(`[BetterDB Semantic Cache] HIT for Agent ${agentIndex}! Matched query: "${matchedItem.prompt.substring(0, 50)}..."`);
        await cache.incrementSemanticHits();
        return matchedItem.response;
      }
    }
  } catch (semErr) {
    console.warn('[BetterDB Semantic Cache] Similarity scan failed:', semErr);
  }

  let resultText = '';

  // 2. Try Gemini first if key is present
  if (geminiKey) {
    try {
      console.log(`[Model Router] Trying Gemini for Agent ${agentIndex}...`);
      // Validate that the key looks like it has content (not just spaces)
      if (geminiKey.trim().length > 5) {
        const ai = new GoogleGenerativeAI(geminiKey);
        const modelName = 'gemini-1.5-flash';
        const model = ai.getGenerativeModel({
          model: modelName,
          generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined,
          systemInstruction: systemInstruction || undefined
        });

        const response = await model.generateContent(prompt);
        resultText = response.response.text();
        console.log(`[Model Router] Gemini Agent ${agentIndex} Succeeded.`);
      }
    } catch (err: any) {
      console.warn(`[Model Router] Gemini Agent ${agentIndex} failed: ${err.message || err}. Falling back to Groq...`);
    }
  }

  // 3. Try Groq as fallback if key is present
  if (!resultText && groqKey) {
    try {
      console.log(`[Model Router] Calling Groq fallback for Agent ${agentIndex}...`);
      const fallbackModel = 'llama-3.3-70b-versatile';
      const payload: any = {
        model: fallbackModel,
        messages: []
      };

      if (systemInstruction) {
        payload.messages.push({ role: 'system', content: systemInstruction });
      }
      payload.messages.push({ role: 'user', content: prompt });

      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Groq API returned ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      resultText = data.choices?.[0]?.message?.content || '';
      console.log(`[Model Router] Groq Agent ${agentIndex} Succeeded.`);
    } catch (err: any) {
      console.error(`[Model Router] Groq Agent ${agentIndex} failed:`, err.message || err);
    }
  }

  // 4. Throw error if both failed
  if (!resultText) {
    throw new Error(`ModelRouterError: Both Gemini and Groq API calls failed or were unconfigured for Agent ${agentIndex}.`);
  }

  // 5. Store in BetterDB Agent Cache
  try {
    await cache.llm.store(cacheKey, resultText);
    await cache.semantic.store(agentIndex, prompt, resultText);
    console.log(`[BetterDB Cache] Saved response (Exact & Semantic) for Agent ${agentIndex}`);
  } catch (err) {
    console.error('[BetterDB Cache] Store failed:', err);
  }

  return resultText;
}
