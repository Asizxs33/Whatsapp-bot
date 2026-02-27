const config = require('../config');

// Пайдаланушылар сессиялары: userId -> { step, subject, type, subjectsList, typesList, lastActivity }
const sessions = new Map();

/**
 * Сессияны алу немесе жаңасын құру
 */
function getSession(userId) {
    if (!sessions.has(userId)) {
        sessions.set(userId, {
            step: 'idle',
            subject: null,
            type: null,
            subjectsList: [],
            typesList: [],
            lastActivity: Date.now()
        });
    }

    const session = sessions.get(userId);

    // Тайм-аут тексеру (5 минут)
    if (Date.now() - session.lastActivity > config.sessionTimeout) {
        resetSession(userId);
        return sessions.get(userId);
    }

    session.lastActivity = Date.now();
    return session;
}

/**
 * Сессияны жаңарту
 */
function updateSession(userId, data) {
    const session = getSession(userId);
    Object.assign(session, data, { lastActivity: Date.now() });
    sessions.set(userId, session);
}

/**
 * Сессияны қайта бастау
 */
function resetSession(userId) {
    sessions.set(userId, {
        step: 'idle',
        subject: null,
        type: null,
        subjectsList: [],
        typesList: [],
        lastActivity: Date.now()
    });
}

// Ескі сессияларды тазалау (әр 10 минут)
setInterval(() => {
    const now = Date.now();
    for (const [userId, session] of sessions) {
        if (now - session.lastActivity > config.sessionTimeout * 2) {
            sessions.delete(userId);
        }
    }
}, 10 * 60 * 1000);

module.exports = {
    getSession,
    updateSession,
    resetSession
};
