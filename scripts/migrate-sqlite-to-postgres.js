/*
Simple migration script to copy data from local SQLite (database.db) to Postgres.
Usage:
  DATABASE_URL="postgres://..." node scripts/migrate-sqlite-to-postgres.js

WARNING: This script assumes target Postgres tables already exist and are empty or can accept duplicate IDs.
Backup both databases before running.
*/

const { migrate } = require('./migrate-lib');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL env var and re-run.');
    process.exit(1);
  }
  try {
    await migrate(databaseUrl);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
