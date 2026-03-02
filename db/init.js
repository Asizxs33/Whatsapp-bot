const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('sslmode=require') && !dbUrl.includes('uselibpqcompat=true')) {
    dbUrl = dbUrl.replace('sslmode=require', 'sslmode=require&uselibpqcompat=true');
}

async function initDatabase() {
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔗 Neon-ға қосылуда...');

        // Схеманы оқу және орындау
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await pool.query(schema);
        console.log('✅ Кесте құрылды');

        // Бұрынғы деректерді тазалау (қайта инициализация үшін)
        await pool.query('DELETE FROM syllabus');

        // Seed деректерін оқу және орындау
        const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
        await pool.query(seed);
        console.log('✅ Демо-деректер толтырылды');

        // Тексеру
        const result = await pool.query('SELECT COUNT(*) as count FROM syllabus');
        console.log(`📊 Жалпы жазбалар саны: ${result.rows[0].count}`);

        const subjects = await pool.query('SELECT DISTINCT subject FROM syllabus ORDER BY subject');
        console.log('📚 Пәндер:');
        subjects.rows.forEach(row => console.log(`   - ${row.subject}`));

    } catch (error) {
        console.error('❌ Қате:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n✅ Деректер қоры дайын!');
    }
}

initDatabase();
