import sqlite3

conn = sqlite3.connect('database.db')

conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
""")

conn.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        instructor TEXT NOT NULL,
        description TEXT,
        telegram_link TEXT,
        price TEXT,
        thumbnail TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        course_type TEXT DEFAULT 'video',
        pdf_file TEXT DEFAULT ''
    )
""")

conn.execute("""
    CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        receipt TEXT,
        status TEXT DEFAULT 'pending'
    )
""")

conn.commit()
conn.close()
print("Database initialized successfully!")