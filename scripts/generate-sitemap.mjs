import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const rootDir = path.resolve(__dirname, '..');
const clientPublicDir = path.join(rootDir, 'client', 'public');
const dbPath = path.join(rootDir, 'database.db');

const siteUrl = (process.env.SITE_URL || process.env.VERCEL_URL || 'https://yvnacademy.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');
const baseUrl = `https://${siteUrl}`;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function readCourseIds() {
  try {
    let rows = [];
    if (process.env.DATABASE_URL) {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
      });
      const result = await pool.query('SELECT id FROM courses ORDER BY id ASC');
      rows = result.rows;
      await pool.end();
    } else {
      const sqlite3 = require('sqlite3');
      const { open } = require('sqlite');
      const db = await open({ filename: dbPath, driver: sqlite3.Database });
      rows = await db.all('SELECT id FROM courses ORDER BY id ASC');
      await db.close();
    }
    return rows.map((row) => ({
      id: row.id,
      updatedAt: new Date().toISOString().slice(0, 10)
    }));
  } catch {
    return [];
  }
}

const staticRoutes = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/about', priority: '0.7', changefreq: 'monthly' },
  { loc: '/courses', priority: '0.9', changefreq: 'daily' },
  { loc: '/login', priority: '0.4', changefreq: 'yearly' },
  { loc: '/register', priority: '0.4', changefreq: 'yearly' }
];

const courses = await readCourseIds();

const urlEntries = [
  ...staticRoutes.map((route) => ({
    loc: `${baseUrl}${route.loc}`,
    changefreq: route.changefreq,
    priority: route.priority,
    lastmod: new Date().toISOString().slice(0, 10)
  })),
  ...courses.map((course) => ({
    loc: `${baseUrl}/course/${course.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: course.updatedAt
  }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.map((entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>
    <changefreq>${escapeXml(entry.changefreq)}</changefreq>
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`;

await fs.mkdir(clientPublicDir, { recursive: true });
await fs.writeFile(path.join(clientPublicDir, 'sitemap.xml'), sitemap, 'utf8');
await fs.writeFile(path.join(clientPublicDir, 'robots.txt'), robots, 'utf8');

console.log(`Generated sitemap and robots.txt for ${baseUrl}`);
