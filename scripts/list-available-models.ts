import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;

console.log('=== Checking API Key Access ===\n');
console.log('API Key:', apiKey?.substring(0, 20) + '...');
console.log('');

if (!apiKey) {
  console.error('ERROR: No API key');
  process.exit(1);
}

async function listModels() {
  const genAI = new GoogleGenerativeAI(apiKey!);

  try {
    console.log('Attempting to list available models...');
    console.log('');

    // Try to list models
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
    );

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ API Request Failed');
      console.log('Status:', response.status, response.statusText);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('This means your API key is NOT valid for the Gemini API.');
      console.log('');
      console.log('WHERE TO GET A VALID KEY:');
      console.log('1. Go to: https://aistudio.google.com/app/apikey');
      console.log('2. Click "Create API key"');
      console.log('3. Key should start with "AIza..."');
      console.log('');
      console.log('Your current key starts with "AQ." which suggests it might be:');
      console.log('- A different Google Cloud service key');
      console.log('- An invalid/expired key');
      console.log('- Not authorized for Generative AI API');
      return;
    }

    console.log('✅ API Key is VALID!');
    console.log('');
    console.log('Available models:');
    console.log('');

    if (data.models && data.models.length > 0) {
      for (const model of data.models) {
        const name = model.name.replace('models/', '');
        const supportedMethods = model.supportedGenerationMethods || [];

        if (supportedMethods.includes('generateContent')) {
          console.log(`✓ ${name}`);
          console.log(`  Display: ${model.displayName || 'N/A'}`);
          console.log(`  Description: ${model.description?.substring(0, 80) || 'N/A'}`);
          console.log('');
        }
      }
    } else {
      console.log('No models available with this API key.');
    }
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    console.log('');
    console.log('This API key cannot access the Gemini API.');
  }
}

listModels();
