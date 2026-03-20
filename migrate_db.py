import sqlite3

conn = sqlite3.connect('database.db')

# Add thumbnail column if it doesn't exist
try:
    conn.execute("ALTER TABLE courses ADD COLUMN thumbnail TEXT DEFAULT ''")
    print("Added thumbnail column")
except sqlite3.OperationalError:
    print("thumbnail column already exists")

# Add is_active column for hide/show functionality
try:
    conn.execute("ALTER TABLE courses ADD COLUMN is_active INTEGER DEFAULT 1")
    print("Added is_active column")
except sqlite3.OperationalError:
    print("is_active column already exists")

conn.commit()
conn.close()
print("Migration complete!")