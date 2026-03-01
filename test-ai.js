const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
    console.log('Testing Gemini API...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No GEMINI_API_KEY found in environment');
        return;
    }

    console.log('API Key starts with:', apiKey.substring(0, 10));

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log('Generating content...');
        const result = await model.generateContent('Сәлем! Бұл тест.');
        console.log('Response:', result.response.text());
        console.log('✅ SUCCESS');
    } catch (err) {
        console.error('❌ ERROR:', err.message);
        if (err.status) console.error('Status:', err.status);
    }
}

test();
