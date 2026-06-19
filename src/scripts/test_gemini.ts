import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const key = process.argv[2] || '';
  if (!key) {
    console.error('No Gemini key provided.');
    process.exit(1);
  }
  console.log('Testing key:', key.substring(0, 15) + '...');
  
  const ai = new GoogleGenerativeAI(key);
  
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-2.5-flash'
  ];
  
  for (const modelName of models) {
    try {
      console.log(`\nTrying model: ${modelName}`);
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello! Tell me in 5 words what model you are.');
      console.log(`Success! Response: "${result.response.text().trim()}"`);
    } catch (err: any) {
      console.error(`Failed for ${modelName}:`, err.message || err);
    }
  }
}

test();
