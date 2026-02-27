const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// EJS баптау
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); // формаларды оқу үшін
app.use(express.json());

// Бот процесін сақтау
let botProcess = null;

// ===================================
// Басты бет (Дашборд)
// ===================================
app.get('/', async (req, res) => {
    try {
        const stats = await db.pool.query('SELECT COUNT(*) as count FROM syllabus');
        res.render('index', {
            botRunning: !!botProcess,
            totalTopics: stats.rows[0].count
        });
    } catch (err) {
        res.status(500).send('Қате: ' + err.message);
    }
});

// ===================================
// Ботты басқару (Қосу/Өшіру)
// ===================================
app.post('/bot/start', (req, res) => {
    if (!botProcess) {
        botProcess = spawn('node', ['bot.js'], { cwd: __dirname });

        botProcess.stdout.on('data', data => console.log(`[Бот] ${data}`));
        botProcess.stderr.on('data', data => console.error(`[Бот Қате] ${data}`));

        botProcess.on('close', code => {
            console.log(`[Бот] Өшірілді (код ${code})`);
            botProcess = null;
        });
    }
    res.redirect('/');
});

app.post('/bot/stop', (req, res) => {
    if (botProcess) {
        botProcess.kill('SIGINT');
        botProcess = null;
    }
    res.redirect('/');
});

// ===================================
// Силлабус базасын басқару
// ===================================
app.get('/syllabus', async (req, res) => {
    try {
        const result = await db.pool.query('SELECT * FROM syllabus ORDER BY subject, week, type');
        res.render('syllabus', {
            topics: result.rows,
            error: null,
            success: null
        });
    } catch (err) {
        res.render('syllabus', { topics: [], error: err.message, success: null });
    }
});

app.post('/syllabus/add', async (req, res) => {
    const { subject, type, week, topic } = req.body;
    try {
        await db.addTopic(subject, type, parseInt(week), topic);
        res.redirect('/syllabus?success=true');
    } catch (err) {
        const result = await db.pool.query('SELECT * FROM syllabus ORDER BY subject, week, type');
        res.render('syllabus', { topics: result.rows, error: 'Қосу қатесі: ' + err.message, success: null });
    }
});

app.post('/syllabus/delete/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.pool.query('DELETE FROM syllabus WHERE id = $1', [id]);
        res.redirect('/syllabus');
    } catch (err) {
        res.status(500).send('Өшіру кезіндегі қате: ' + err.message);
    }
});

// ===================================
// Серверді қосу
// ===================================
app.listen(PORT, () => {
    console.log(`\n🚀 Admin Dashboard іске қосылды: http://localhost:${PORT}`);
});
