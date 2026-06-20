/*
Simple migration script to copy data from local SQLite (database.db) to Postgres.
Usage:
  DATABASE_URL="postgres://..." node scripts/migrate-sqlite-to-postgres.js

WARNING: This script assumes target Postgres tables already exist and are empty or can accept duplicate IDs.
Backup both databases before running.
*/

const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { Pool } = require('pg');

async function migrate() {
  const databasePath = `${__dirname}/../database.db`;
  const sqliteDb = await open({ filename: databasePath, driver: sqlite3.Database });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL env var and re-run.');
    process.exit(1);
  }

  const pg = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Reading from SQLite:', databasePath);

    // Tables to migrate and their columns
    const tables = [
      { name: 'users', cols: ['id','name','email','password'] },
      { name: 'courses', cols: ['id','title','instructor','description','telegram_link','price','thumbnail','is_active','course_type','pdf_file','preview_text'] },
      { name: 'purchases', cols: ['id','user_id','course_id','receipt','status'] },
      { name: 'ratings', cols: ['id','user_id','course_id','stars','review','date'] },
      { name: 'wishlist', cols: ['id','user_id','course_id','date'] }
    ];

    for (const t of tables) {
      console.log(`\nMigrating table ${t.name}...`);
      const rows = await sqliteDb.all(`SELECT ${t.cols.join(',')} FROM ${t.name}`);
      console.log(`Found ${rows.length} rows in SQLite ${t.name}`);
      if (rows.length === 0) continue;

      // Build insert statement preserving id
      const colList = t.cols.join(',');
      const paramList = t.cols.map((_,i) => `$${i+1}`).join(',');
      const insertSql = `INSERT INTO ${t.name} (${colList}) VALUES (${paramList})`;

      let migrated = 0;
      for (const r of rows) {
        const vals = t.cols.map((c) => r[c]);
        try {
          await pg.query(insertSql, vals);
          migrated++;
        } catch (err) {
          console.error(`Failed to insert into ${t.name} id=${r.id}:`, err.message);
        }
      }
      console.log(`Inserted ${migrated}/${rows.length} rows into Postgres ${t.name}`);

      // Reset sequence (Postgres only) if id column exists
      try {
        await pg.query(`SELECT setval(pg_get_serial_sequence('${t.name}','id'), (SELECT COALESCE(MAX(id),1) FROM ${t.name}));`);
      } catch (err) {
        // ignore
      }
    }

    console.log('\nMigration complete.');
  } finally {
    await sqliteDb.close();
    await pg.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
