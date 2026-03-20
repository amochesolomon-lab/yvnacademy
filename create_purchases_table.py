import sqlite3

conn = sqlite3.connect('database.db')

conn.execute('''
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    receipt TEXT,
    status TEXT DEFAULT 'pending'
)
''')

conn.commit()
conn.close()

print("Purchases table created successfully")