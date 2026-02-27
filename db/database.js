const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

/**
 * Тақырыптарды іздеу
 * @param {string} subject - Пән атауы
 * @param {string|null} type - Сабақ түрі (Дәріс, Практика, Зертханалық)
 * @param {number|null} week - Апта нөмірі
 * @returns {Promise<Array>}
 */
async function findTopics(subject, type = null, week = null) {
    let query = 'SELECT * FROM syllabus WHERE subject ILIKE $1';
    const params = [`%${subject}%`];
    let paramIndex = 2;

    if (type) {
        query += ` AND type ILIKE $${paramIndex}`;
        params.push(`%${type}%`);
        paramIndex++;
    }

    if (week) {
        query += ` AND week = $${paramIndex}`;
        params.push(week);
        paramIndex++;
    }

    query += ' ORDER BY week, type';
    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Барлық пәндер тізімі
 * @returns {Promise<Array<string>>}
 */
async function getSubjects() {
    const result = await pool.query('SELECT DISTINCT subject FROM syllabus ORDER BY subject');
    return result.rows.map(row => row.subject);
}

/**
 * Пән бойынша қолжетімді апталар
 * @param {string} subject
 * @returns {Promise<Array<number>>}
 */
async function getWeeks(subject) {
    const result = await pool.query(
        'SELECT DISTINCT week FROM syllabus WHERE subject ILIKE $1 ORDER BY week',
        [`%${subject}%`]
    );
    return result.rows.map(row => row.week);
}

/**
 * Пән бойынша сабақ түрлері
 * @param {string} subject
 * @returns {Promise<Array<string>>}
 */
async function getTypes(subject) {
    const result = await pool.query(
        'SELECT DISTINCT type FROM syllabus WHERE subject ILIKE $1 ORDER BY type',
        [`%${subject}%`]
    );
    return result.rows.map(row => row.type);
}

/**
 * Жаңа тақырып қосу
 */
async function addTopic(subject, type, week, topic) {
    const result = await pool.query(
        'INSERT INTO syllabus (subject, type, week, topic) VALUES ($1, $2, $3, $4) RETURNING *',
        [subject, type, week, topic]
    );
    return result.rows[0];
}

module.exports = {
    findTopics,
    getSubjects,
    getWeeks,
    getTypes,
    addTopic,
    pool
};
