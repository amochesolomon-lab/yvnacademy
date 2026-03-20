import sqlite3

conn = sqlite3.connect('database.db')

# Add course_type column (pdf or video)
try:
    conn.execute("ALTER TABLE courses ADD COLUMN course_type TEXT DEFAULT 'video'")
    print("Added course_type column")
except sqlite3.OperationalError:
    print("course_type column already exists")

# Add pdf_file column to store uploaded PDF filename
try:
    conn.execute("ALTER TABLE courses ADD COLUMN pdf_file TEXT DEFAULT ''")
    print("Added pdf_file column")
except sqlite3.OperationalError:
    print("pdf_file column already exists")

conn.commit()
conn.close()
print("Migration complete!")