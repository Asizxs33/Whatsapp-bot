const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const db = require('./db/database');
const config = require('./config');
const { getSession, updateSession, resetSession } = require('./session/sessionManager');
const { parseQuickCommand, parseCommand, parseMenuChoice } = require('./parser/messageParser');

// ============================================
// WhatsApp клиентін инициализация
// ============================================
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

// QR-код көрсету
client.on('qr', (qr) => {
    console.log('\n📱 QR-кодты WhatsApp-пен сканерлеңіз:\n');
    qrcode.generate(qr, { small: true });
});

// Сәтті қосылу
client.on('ready', () => {
    console.log('\n✅ Бот іске қосылды! WhatsApp-қа сәтті қосылды.');
    console.log('📨 Хабарламаларды күтуде...\n');
});

// Аутентификация сәтсіз
client.on('auth_failure', (msg) => {
    console.error('❌ Аутентификация қатесі:', msg);
});

// Ажыратылу
client.on('disconnected', (reason) => {
    console.log('🔌 Ажыратылды:', reason);
});

// ============================================
// Хабарламаларды өңдеу
// ============================================
client.on('message', async (message) => {
    // Топтық чаттарды және статустарды (broadcast) елемеу
    if (message.from.includes('@g.us') || message.from === 'status@broadcast' || message.isStatus) return;

    const originalText = message.body.trim();
    if (!originalText) return;

    const userId = message.from;
    const session = getSession(userId);
    const lowerText = originalText.toLowerCase();

    let textToProcess = originalText;

    // 1. Егер сессия жаңа (idle) болса, міндетті түрде "Аси Силабус" деп басталуы керек
    if (session.step === 'idle' && !lowerText.startsWith('аси силабус')) {
        return;
    }

    // 2. Егер хабарлама "Аси Силабус" деп басталса (кез келген қадамда)
    if (lowerText.startsWith('аси силабус')) {
        textToProcess = originalText.substring(11).trim() || 'сәлем';
        // Мәзірді басынан бастау үшін сессияны тазалаймыз
        if (session.step !== 'idle') {
            resetSession(userId);
        }
    }

    console.log(`📩 ${userId}: ${originalText}`);

    try {
        const reply = await handleMessage(userId, textToProcess);
        if (reply) {
            await message.reply(reply);
            console.log(`📤 Жауап жіберілді`);
        }
    } catch (error) {
        console.error('❌ Қате:', error);
        await message.reply('⚠️ Қате орын алды. Қайтадан көріңіз.');
    }
});

// ============================================
// Негізгі логика
// ============================================
async function handleMessage(userId, text) {
    // 1. Команда тексеру (!көмек, !пәндер, !болдырмау)
    const command = parseCommand(text);
    if (command) {
        return await handleCommand(userId, command);
    }

    // 2. Жылдам команда тексеру (мысалы: "прога дәріс 4")
    const quick = parseQuickCommand(text);
    if (quick) {
        return await handleQuickCommand(quick);
    }

    // 3. Интерактивті мәзір
    return await handleMenu(userId, text);
}

// ============================================
// Командалар
// ============================================
async function handleCommand(userId, command) {
    switch (command) {
        case 'help':
            return config.messages.help;

        case 'subjects': {
            const subjects = await db.getSubjects();
            let msg = '📚 *Қолжетімді пәндер:*\n\n';
            subjects.forEach((s, i) => {
                msg += `${i + 1}. ${s}\n`;
            });
            return msg;
        }

        case 'cancel':
            resetSession(userId);
            const subjects = await db.getSubjects();
            let msg = config.messages.cancelled + '\n\n';
            subjects.forEach((s, i) => {
                msg += `${i + 1}. ${s}\n`;
            });
            updateSession(userId, { step: 'select_subject', subjectsList: subjects });
            return msg;
    }
}

// ============================================
// Жылдам командалар
// ============================================
async function handleQuickCommand(parsed) {
    const results = await db.findTopics(parsed.subject, parsed.type, parsed.week);

    if (results.length === 0) {
        return config.messages.notFound;
    }

    return formatResults(results);
}

// ============================================
// Интерактивті мәзір
// ============================================
async function handleMenu(userId, text) {
    const session = getSession(userId);

    switch (session.step) {
        // ---- Бастапқы күй: пәнді таңдау ----
        case 'idle': {
            const subjects = await db.getSubjects();
            let msg = config.messages.welcome + '\n\n';
            subjects.forEach((s, i) => {
                msg += `${i + 1}. ${s}\n`;
            });
            updateSession(userId, {
                step: 'select_subject',
                subjectsList: subjects
            });
            return msg;
        }

        // ---- Пән таңдалды → сабақ түрін көрсету ----
        case 'select_subject': {
            const choice = parseMenuChoice(text);
            const subjects = session.subjectsList;

            if (!choice || choice < 1 || choice > subjects.length) {
                return config.messages.invalidChoice;
            }

            const subject = subjects[choice - 1];
            const types = await db.getTypes(subject);

            let msg = `📚 *${subject}*\n${config.messages.selectType}\n\n`;
            types.forEach((t, i) => {
                msg += `${i + 1}. ${t}\n`;
            });

            updateSession(userId, {
                step: 'select_type',
                subject: subject,
                typesList: types
            });
            return msg;
        }

        // ---- Түр таңдалды → апта нөмірін сұрау ----
        case 'select_type': {
            const choice = parseMenuChoice(text);
            const types = session.typesList;

            if (!choice || choice < 1 || choice > types.length) {
                return config.messages.invalidChoice;
            }

            const type = types[choice - 1];
            const weeks = await db.getWeeks(session.subject);

            let msg = `📚 *${session.subject}* | *${type}*\n`;
            msg += `${config.messages.selectWeek}\n\n`;
            msg += `📅 Қолжетімді апталар: ${weeks.join(', ')}`;

            updateSession(userId, {
                step: 'select_week',
                type: type
            });
            return msg;
        }

        // ---- Апта нөмірі → нәтижені көрсету ----
        case 'select_week': {
            const week = parseMenuChoice(text);

            if (!week || week < 1 || week > 15) {
                return config.messages.invalidWeek;
            }

            const results = await db.findTopics(session.subject, session.type, week);
            resetSession(userId);

            if (results.length === 0) {
                return config.messages.notFound;
            }

            return formatResults(results);
        }

        default: {
            resetSession(userId);
            return await handleMenu(userId, text);
        }
    }
}

// ============================================
// Нәтижелерді форматтау
// ============================================
function formatResults(results) {
    if (results.length === 1) {
        const r = results[0];
        return `✅ *${r.subject}* | *${r.type}* | *${r.week}-апта:*\n\n📖 ${r.topic}`;
    }

    let msg = `✅ *Табылған нәтижелер (${results.length}):*\n\n`;
    for (const r of results) {
        msg += `📖 *${r.subject}* | ${r.type} | ${r.week}-апта\n`;
        msg += `   ${r.topic}\n\n`;
    }
    return msg;
}

// ============================================
// Ботты іске қосу
// ============================================
console.log('🤖 Силлабус бот іске қосылуда...');
console.log('📱 QR-код күтілуде...\n');
client.initialize();
