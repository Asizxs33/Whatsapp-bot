const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    console.log('Fetching available models...');
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const models = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        console.log('Available models for generation:');
        for (const m of models) {
            console.log(`- ${m.name}`);
        }
    } catch (err) {
        console.error('ERROR fetching models:', err.message);
    }
}

listModels();
