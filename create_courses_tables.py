import sqlite3

conn = sqlite3.connect('database.db')

conn.execute('''
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    instructor TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL
)
''')

conn.commit()
conn.close()

print("Courses table created successfully!")