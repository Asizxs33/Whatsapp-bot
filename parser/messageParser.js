const config = require('../config');

/**
 * Хабарламаны талдау — жылдам команда ма, әлде мәзір жауабы ма
 * 
 * Жылдам команда мысалдары:
 *   "прога дәріс 4"
 *   "матан прак 2"
 *   "физика лек 3"
 */
function parseQuickCommand(text) {
    const lower = text.toLowerCase().trim();
    const words = lower.split(/\s+/);

    let subject = null;
    let type = null;
    let week = null;

    for (const word of words) {
        // Пәнді іздеу
        if (!subject && config.subjectAliases[word]) {
            subject = config.subjectAliases[word];
            continue;
        }

        // Сабақ түрін іздеу
        if (!type && config.typeAliases[word]) {
            type = config.typeAliases[word];
            continue;
        }

        // Апта нөмірін іздеу
        if (!week) {
            const num = parseInt(word);
            if (!isNaN(num) && num >= 1 && num <= 15) {
                week = num;
                continue;
            }

            // "4-апта" немесе "4апта" форматы
            const weekMatch = word.match(/^(\d+)[-]?апта$/);
            if (weekMatch) {
                week = parseInt(weekMatch[1]);
                continue;
            }
        }
    }

    // Кем дегенде пән табылса — жылдам команда деп есептейміз
    if (subject) {
        return { subject, type, week, isQuick: true };
    }

    return null;
}

/**
 * Команда ма тексеру (!көмек, !пәндер, !болдырмау)
 */
function parseCommand(text) {
    const lower = text.toLowerCase().trim();

    if (lower === '!көмек' || lower === '!help' || lower === '!комек') {
        return 'help';
    }
    if (lower === '!пәндер' || lower === '!пандер' || lower === '!предметы') {
        return 'subjects';
    }
    if (lower === 'стоп' || lower === 'stop' || lower === '!болдырмау' || lower === '!отмена') {
        return 'cancel';
    }

    return null;
}

/**
 * Мәзірдегі таңдау нөмірін алу
 */
function parseMenuChoice(text) {
    const trimmed = text.trim();
    const num = parseInt(trimmed);
    if (!isNaN(num) && num > 0) {
        return num;
    }
    return null;
}

module.exports = {
    parseQuickCommand,
    parseCommand,
    parseMenuChoice
};
