import sqlite3

conn = sqlite3.connect('database.db')

conn.execute("""
ALTER TABLE courses
ADD COLUMN telegram_link TEXT
""")

conn.commit()
conn.close()

print("Courses table updated with telegram_link column")