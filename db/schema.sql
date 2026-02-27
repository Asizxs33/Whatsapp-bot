CREATE TABLE IF NOT EXISTS syllabus (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    week INTEGER NOT NULL,
    topic TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_syllabus_lookup 
    ON syllabus (subject, type, week);
