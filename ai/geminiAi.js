const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize the Gemini API client
let genAI = null;
let model = null;

function initAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ GEMINI_API_KEY табылмады. Жасанды интеллект функциясы істемейді.');
        return false;
    }

    try {
        genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash as it's fast and suitable for text tasks
        model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: 'Сен силлабус анықтамалығының көмекші ботысың. Барлық сұрақтарға тек қана қазақ тілінде жауап бер. Егер лекция немесе бөж туралы сұраса, толық және пайдалы мәлімет бер.',
        });
        return true;
    } catch (error) {
        console.error('❌ Gemini AI инициализациясында қате:', error);
        return false;
    }
}

async function generateAIResponse(prompt) {
    if (!model && !initAI()) {
        return 'Кешіріңіз, жасанды интеллект жүйесі қазір қолжетімсіз (API кілті бапталмаған).';
    }

    try {
        // Generate content based on the prompt
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error('❌ AI жауабын алуда қате:', error);
        return 'Кешіріңіз, сұрағыңызды өңдеу кезінде қате орын алды. Сәлден соң қайталап көріңіз.';
    }
}

module.exports = {
    generateAIResponse
};
