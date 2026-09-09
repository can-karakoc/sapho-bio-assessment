import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;

console.log('=== Gemini API Test ===\n');
console.log('API Key exists:', !!apiKey);
console.log('API Key length:', apiKey?.length || 0);
console.log('API Key starts with:', apiKey?.substring(0, 10));
console.log('API Key format check:', apiKey?.startsWith('AIza') ? '✓ Standard format' : '⚠️ Non-standard format (expected AIza...)');
console.log('');

if (!apiKey) {
  console.error('ERROR: No API key found in .env.local');
  process.exit(1);
}

// Test different models
const modelsToTest = [
  'gemini-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
];

async function testModel(modelName: string) {
  console.log(`\n--- Testing model: ${modelName} ---`);

  const genAI = new GoogleGenerativeAI(apiKey!);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log('Model instance created ✓');
    console.log('Sending test prompt...');

    const result = await model.generateContent('Say "API works!" in exactly 2 words.');
    const response = result.response;
    const text = response.text();

    console.log('✓ SUCCESS!');
    console.log('Response:', text);
    console.log('Model:', modelName, 'WORKS ✓');

    return true;
  } catch (error: any) {
    console.log('✗ FAILED');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);

    if (error.status) {
      console.log('HTTP Status:', error.status, error.statusText);
    }

    if (error.errorDetails) {
      console.log('Error details:', JSON.stringify(error.errorDetails, null, 2));
    }

    return false;
  }
}

async function main() {
  console.log('Starting model tests...\n');

  for (const modelName of modelsToTest) {
    const success = await testModel(modelName);
    if (success) {
      console.log(`\n✓✓✓ WORKING MODEL FOUND: ${modelName} ✓✓✓`);
      console.log(`Update lib/llm.ts to use: '${modelName}'`);
      break;
    }

    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
