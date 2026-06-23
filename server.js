const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
require("dotenv").config();
let Pool;
try {
  ({ Pool } = require("pg"));
} catch (err) {
  Pool = null;
}

const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);

// Admin emails list
const ADMIN_EMAILS = ["theseraphicd3signer@gmail.com", "bellaonyi5@gmail.com"];

// Make sure storage directories exist
fs.mkdirSync(path.join(__dirname, "static/images"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "static/pdfs"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "static/receipts"), { recursive: true });

// Setup JSON & Form URL-Encoded parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup CORS
const productionOrigin = process.env.SITE_URL
  ? process.env.SITE_URL.replace(/\/+$/, "")
  : null;
app.use(
  cors({
    origin: productionOrigin
      ? ["http://localhost:3000", "http://localhost:5173", productionOrigin]
      : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);

// Setup Sessions
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SECRET_KEY || "yvn_secret_key12"],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // In production when frontend is hosted on a different origin we need secure cookies
    secure: process.env.NODE_ENV === "production",
    // Allow cookies for cross-site requests (frontend on Vercel) — browsers require Secure when SameSite=None
    sameSite: process.env.COOKIE_SAMESITE || "none",
    httpOnly: true,
  }),
);

// Serve static assets directly
app.use("/static", express.static(path.join(__dirname, "static")));

// Database helper
let db;
let pgPool;

function translatePlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function splitStatements(sql) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function makeDatabaseAdapter(pool) {
  return {
    async exec(sql) {
      for (const statement of splitStatements(sql)) {
        await pool.query(statement);
      }
    },
    async run(sql, params = []) {
      const result = await pool.query(translatePlaceholders(sql), params);
      return {
        changes: result.rowCount || 0,
        lastID: result.rows?.[0]?.id ?? null,
      };
    },
    async get(sql, params = []) {
      const result = await pool.query(translatePlaceholders(sql), params);
      return result.rows[0];
    },
    async all(sql, params = []) {
      const result = await pool.query(translatePlaceholders(sql), params);
      return result.rows;
    },
  };
}

async function initDbSchema(database) {
  if (process.env.DATABASE_URL && Pool) {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS courses (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        instructor TEXT NOT NULL,
        description TEXT,
        telegram_link TEXT,
        price TEXT,
        thumbnail TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        course_type TEXT DEFAULT 'video',
        pdf_file TEXT DEFAULT '',
        preview_text TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS purchases (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        receipt TEXT,
        status TEXT DEFAULT 'pending'
      );
      CREATE TABLE IF NOT EXISTS ratings (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        stars INTEGER NOT NULL,
        review TEXT,
        date TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      );
      CREATE TABLE IF NOT EXISTS wishlist (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        date TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, course_id)
      );
    `);
  } else {
    await database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    await database.exec(`
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
        pdf_file TEXT DEFAULT '',
        preview_text TEXT DEFAULT ''
      )
    `);
    await database.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        receipt TEXT,
        status TEXT DEFAULT 'pending'
      )
    `);
    await database.exec(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        stars INTEGER NOT NULL,
        review TEXT,
        date TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, course_id)
      )
    `);
    await database.exec(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        date TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, course_id)
      )
    `);
  }
  try {
    await database.exec(
      "ALTER TABLE courses ADD COLUMN preview_text TEXT DEFAULT ''",
    );
  } catch (e) {
    // Column already exists
  }
}

async function getDbConnection() {
  if (!db) {
    if (process.env.DATABASE_URL && Pool) {
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
      });
      db = makeDatabaseAdapter(pgPool);
    } else {
      db = await open({
        filename: path.join(__dirname, "database.db"),
        driver: sqlite3.Database,
      });
    }
    await initDbSchema(db);
  }
  return db;
}

// Password Hashing compatibility with Werkzeug's scrypt format
function verifyPassword(password, hashStr) {
  try {
    const parts = hashStr.split("$");
    if (parts.length !== 3) return false;

    const params = parts[0].split(":");
    if (params[0] !== "scrypt") return false;

    const N = parseInt(params[1], 10);
    const r = parseInt(params[2], 10);
    const p = parseInt(params[3], 10);

    const salt = parts[1];
    const hash = parts[2];

    const keylen = Buffer.from(hash, "hex").length;

    return new Promise((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        keylen,
        { N, r, p, maxmem: 128 * 1024 * 1024 },
        (err, derivedKey) => {
          if (err) return resolve(false);
          resolve(derivedKey.toString("hex") === hash);
        },
      );
    });
  } catch (err) {
    return false;
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(8).toString("hex"); // 16-character salt
  const N = 32768;
  const r = 8;
  const p = 1;
  const keylen = 64;
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      keylen,
      { N, r, p, maxmem: 128 * 1024 * 1024 },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt:${N}:${r}:${p}$${salt}$${derivedKey.toString("hex")}`);
      },
    );
  });
}

// Multer Upload configuration
const upload = multer({ storage: multer.memoryStorage() });

function fileToDataUrl(file) {
  if (!file || !file.buffer) return "";
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

function decodeDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

// Middlewares
function loginRequired(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in to continue." });
  }
  next();
}

function adminRequired(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in to continue." });
  }
  const email = req.session.userEmail || "";
  const isAdmin = req.session.isAdmin || ADMIN_EMAILS.includes(email);
  if (!isAdmin) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }
  try {
    const database = await getDbConnection();
    const hashedPassword = await hashPassword(password);
    await database.run(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
    );
    res.json({ message: "Account created! Please log in." });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed: users.email")) {
      return res
        .status(400)
        .json({ error: "Email already registered. Please log in." });
    }
    res.status(500).json({ error: "Database error. Please try again." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide email and password." });
  }
  try {
    const database = await getDbConnection();
    const user = await database.get("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (user && (await verifyPassword(password, user.password))) {
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = email;
      req.session.isAdmin = ADMIN_EMAILS.includes(email);
      res.json({
        logged_in: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: req.session.isAdmin,
        },
      });
    } else {
      res.status(400).json({ error: "Invalid email or password." });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session = null;
  res.json({ message: "You have been logged out." });
});

app.get("/api/auth/me", (req, res) => {
  if (req.session.userId) {
    res.json({
      logged_in: true,
      username: req.session.userName,
      email: req.session.userEmail,
      is_admin:
        req.session.isAdmin || ADMIN_EMAILS.includes(req.session.userEmail),
    });
  } else {
    res.json({ logged_in: false });
  }
});

// Courses API
app.get("/api/courses", async (req, res) => {
  const query = req.query.q ? req.query.q.trim() : "";
  try {
    const database = await getDbConnection();
    let courses;
    if (query) {
      courses = await database.all(
        "SELECT * FROM courses WHERE is_active=1 AND (title LIKE ? OR description LIKE ? OR instructor LIKE ?)",
        [`%${query}%`, `%${query}%`, `%${query}%`],
      );
    } else {
      courses = await database.all("SELECT * FROM courses WHERE is_active=1");
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Internal database error." });
  }
});

app.get("/api/courses/:id", async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  try {
    const database = await getDbConnection();
    const course = await database.get("SELECT * FROM courses WHERE id = ?", [
      courseId,
    ]);
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }

    let purchased = null;
    let wishlisted = false;
    let user_rating = null;

    if (req.session.userId) {
      const userId = req.session.userId;
      purchased = await database.get(
        "SELECT * FROM purchases WHERE user_id = ? AND course_id = ?",
        [userId, courseId],
      );
      const wishlistRecord = await database.get(
        "SELECT id FROM wishlist WHERE user_id = ? AND course_id = ?",
        [userId, courseId],
      );
      wishlisted = !!wishlistRecord;
      user_rating = await database.get(
        "SELECT * FROM ratings WHERE user_id = ? AND course_id = ?",
        [userId, courseId],
      );
    }

    const ratings = await database.all(
      `SELECT ratings.*, users.name FROM ratings
       JOIN users ON ratings.user_id = users.id
       WHERE ratings.course_id = ?
       ORDER BY ratings.date DESC`,
      [courseId],
    );

    let avg_rating = 0;
    if (ratings.length > 0) {
      avg_rating =
        Math.round(
          (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10,
        ) / 10;
    }

    res.json({
      course,
      purchased,
      wishlisted,
      ratings,
      avg_rating,
      user_rating,
    });
  } catch (err) {
    res.status(500).json({ error: "Error retrieving course details." });
  }
});

// Buy Course (Receipt Submission)
app.post(
  "/api/courses/:id/buy",
  loginRequired,
  upload.single("receipt"),
  async (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const userId = req.session.userId;
    if (!req.file) {
      return res.status(400).json({ error: "Please upload your receipt." });
    }
    try {
      const database = await getDbConnection();
      const receiptData = fileToDataUrl(req.file);
      await database.run(
        "INSERT INTO purchases (user_id, course_id, receipt, status) VALUES (?, ?, ?, ?)",
        [userId, courseId, receiptData, "pending"],
      );
      res.json({
        message:
          "Receipt submitted! We will review and approve your access shortly.",
      });
    } catch (err) {
      res.status(500).json({ error: "Database error. Please try again." });
    }
  },
);

// View Content Info
app.get("/api/courses/:id/content", loginRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const userId = req.session.userId;
  try {
    const database = await getDbConnection();
    const purchase = await database.get(
      "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved'",
      [userId, courseId],
    );
    if (!purchase) {
      return res
        .status(403)
        .json({ error: "You do not have access to this course yet." });
    }
    const course = await database.get("SELECT * FROM courses WHERE id=?", [
      courseId,
    ]);
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// Serve PDF Stream
app.get("/api/courses/:id/pdf", loginRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const userId = req.session.userId;
  try {
    const database = await getDbConnection();
    const purchase = await database.get(
      "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved'",
      [userId, courseId],
    );
    if (!purchase) {
      return res.status(403).send("Access denied");
    }
    const course = await database.get("SELECT * FROM courses WHERE id=?", [
      courseId,
    ]);
    if (!course || !course.pdf_file) {
      return res.status(404).send("PDF file not found");
    }
    const embeddedPdf = decodeDataUrl(course.pdf_file);
    if (embeddedPdf) {
      res.setHeader("Content-Type", embeddedPdf.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      return res.send(embeddedPdf.buffer);
    }
    const filePath = path.join(__dirname, "static/pdfs", course.pdf_file);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      res.sendFile(filePath);
    } else {
      res.status(404).send("PDF file does not exist on disk.");
    }
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Download PDF
app.get("/api/courses/:id/download", loginRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const userId = req.session.userId;
  try {
    const database = await getDbConnection();
    const purchase = await database.get(
      "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved'",
      [userId, courseId],
    );
    if (!purchase) {
      return res.status(403).send("Access denied");
    }
    const course = await database.get("SELECT * FROM courses WHERE id=?", [
      courseId,
    ]);
    if (!course || !course.pdf_file) {
      return res.status(404).send("PDF file not found");
    }
    const embeddedPdf = decodeDataUrl(course.pdf_file);
    if (embeddedPdf) {
      res.setHeader("Content-Type", embeddedPdf.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="course.pdf"');
      return res.send(embeddedPdf.buffer);
    }
    const filePath = path.join(__dirname, "static/pdfs", course.pdf_file);
    if (fs.existsSync(filePath)) {
      res.download(filePath, course.pdf_file);
    } else {
      res.status(404).send("PDF file does not exist on disk.");
    }
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Rate Course
app.post("/api/courses/:id/rate", loginRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const userId = req.session.userId;
  const stars = parseInt(req.body.stars, 10) || 5;
  const review = (req.body.review || "").trim();

  try {
    const database = await getDbConnection();
    const purchase = await database.get(
      "SELECT * FROM purchases WHERE user_id=? AND course_id=? AND status='approved'",
      [userId, courseId],
    );
    if (!purchase) {
      return res
        .status(400)
        .json({ error: "You can only rate courses you have completed." });
    }

    // SQLite equivalent of ON CONFLICT(user_id, course_id) DO UPDATE
    const updatedAtExpr =
      process.env.DATABASE_URL && Pool ? "NOW()" : "datetime('now')";
    await database.run(
      `
      INSERT INTO ratings (user_id, course_id, stars, review)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, course_id) DO UPDATE SET stars=excluded.stars, review=excluded.review, date=${updatedAtExpr}
    `,
      [userId, courseId, stars, review],
    );

    res.json({ message: "Thank you for your rating!" });
  } catch (err) {
    res.status(500).json({ error: "Could not save rating. Please try again." });
  }
});

// Wishlist
app.get("/api/wishlist", loginRequired, async (req, res) => {
  const userId = req.session.userId;
  try {
    const database = await getDbConnection();
    const items = await database.all(
      `
      SELECT courses.* FROM wishlist
      JOIN courses ON wishlist.course_id = courses.id
      WHERE wishlist.user_id = ? AND courses.is_active = 1
      ORDER BY wishlist.date DESC
    `,
      [userId],
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Internal database error." });
  }
});

app.post("/api/wishlist/:id", loginRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const userId = req.session.userId;
  try {
    const database = await getDbConnection();
    await database.run(
      "INSERT INTO wishlist (user_id, course_id) VALUES (?, ?)",
      [userId, courseId],
    );
    res.json({ message: "Course saved to your wishlist!" });
  } catch (err) {
    res.status(400).json({ error: "Already in your wishlist." });
  }
});

app.delete("/api/wishlist/:id", loginRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const userId = req.session.userId;
  try {
    const database = await getDbConnection();
    await database.run("DELETE FROM wishlist WHERE user_id=? AND course_id=?", [
      userId,
      courseId,
    ]);
    res.json({ message: "Removed from wishlist." });
  } catch (err) {
    res.status(500).json({ error: "Internal database error." });
  }
});

// Dashboard (User's purchased courses status)
app.get("/api/dashboard", loginRequired, async (req, res) => {
  const userId = req.session.userId;
  try {
    const database = await getDbConnection();
    const list = await database.all(
      `
      SELECT courses.title, purchases.status, courses.id,
             courses.telegram_link, courses.course_type
      FROM purchases
      JOIN courses ON purchases.course_id = courses.id
      WHERE purchases.user_id = ?
    `,
      [userId],
    );
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// ==============================================================
// ADMIN ROUTES
// ==============================================================

// View purchases
app.get("/api/admin/purchases", adminRequired, async (req, res) => {
  try {
    const database = await getDbConnection();
    const purchases = await database.all(`
      SELECT purchases.id, users.email, courses.title,
             purchases.receipt, purchases.status, courses.price
      FROM purchases
      JOIN users ON purchases.user_id = users.id
      JOIN courses ON purchases.course_id = courses.id
      ORDER BY purchases.id DESC
    `);
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// Approve purchase
app.post(
  "/api/admin/purchases/:id/approve",
  adminRequired,
  async (req, res) => {
    const purchaseId = parseInt(req.params.id, 10);
    try {
      const database = await getDbConnection();
      await database.run(
        "UPDATE purchases SET status = 'approved' WHERE id = ?",
        [purchaseId],
      );
      res.json({ message: "Purchase approved!" });
    } catch (err) {
      res.status(500).json({ error: "Database error." });
    }
  },
);

// Reject purchase
app.post("/api/admin/purchases/:id/reject", adminRequired, async (req, res) => {
  const purchaseId = parseInt(req.params.id, 10);
  const reason = req.body.reason || "Your receipt could not be verified.";
  try {
    const database = await getDbConnection();
    await database.run("UPDATE purchases SET status = ? WHERE id = ?", [
      "rejected: " + reason,
      purchaseId,
    ]);
    res.json({ message: "Purchase rejected." });
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// Manage courses
app.get("/api/admin/courses", adminRequired, async (req, res) => {
  try {
    const database = await getDbConnection();
    const courses = await database.all(
      "SELECT * FROM courses ORDER BY id DESC",
    );
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// Add Course
app.post(
  "/api/admin/courses",
  adminRequired,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "pdf_file", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      title,
      instructor,
      description,
      price,
      course_type,
      telegram_link,
      preview_text,
    } = req.body;
    if (!title || !instructor || !price) {
      return res
        .status(400)
        .json({ error: "Missing title, instructor, or price." });
    }

    const thumbnailFile =
      req.files && req.files["thumbnail"]
        ? fileToDataUrl(req.files["thumbnail"][0])
        : "";
    const pdfFile =
      req.files && req.files["pdf_file"]
        ? fileToDataUrl(req.files["pdf_file"][0])
        : "";

    try {
      const database = await getDbConnection();
      await database.run(
        `INSERT INTO courses (title, instructor, description, telegram_link, price, course_type, pdf_file, thumbnail, preview_text) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          instructor,
          description,
          telegram_link || "",
          price,
          course_type || "video",
          pdfFile,
          thumbnailFile,
          preview_text || "",
        ],
      );
      res.json({ message: "Course published successfully!" });
    } catch (err) {
      res.status(500).json({ error: "Database error." });
    }
  },
);

// Edit Course
app.put(
  "/api/admin/courses/:id",
  adminRequired,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "pdf_file", maxCount: 1 },
  ]),
  async (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const {
      title,
      instructor,
      description,
      telegram_link,
      price,
      is_active,
      course_type,
      preview_text,
    } = req.body;

    const thumbnailFile =
      req.files && req.files["thumbnail"]
        ? fileToDataUrl(req.files["thumbnail"][0])
        : null;
    const pdfFile =
      req.files && req.files["pdf_file"]
        ? fileToDataUrl(req.files["pdf_file"][0])
        : null;

    try {
      const database = await getDbConnection();
      const course = await database.get("SELECT * FROM courses WHERE id=?", [
        courseId,
      ]);
      if (!course) {
        return res.status(404).json({ error: "Course not found." });
      }

      const updatedTitle = title !== undefined ? title : course.title;
      const updatedInstructor =
        instructor !== undefined ? instructor : course.instructor;
      const updatedDesc =
        description !== undefined ? description : course.description;
      const updatedTelLink =
        telegram_link !== undefined ? telegram_link : course.telegram_link;
      const updatedPrice = price !== undefined ? price : course.price;
      const updatedIsActive =
        is_active !== undefined ? parseInt(is_active, 10) : course.is_active;
      const updatedType =
        course_type !== undefined ? course_type : course.course_type;
      const updatedPreview =
        preview_text !== undefined ? preview_text : course.preview_text;
      const updatedThumbnail = thumbnailFile ? thumbnailFile : course.thumbnail;
      const updatedPdf = pdfFile ? pdfFile : course.pdf_file;

      await database.run(
        `
      UPDATE courses SET title=?, instructor=?, description=?,
      telegram_link=?, price=?, is_active=?, thumbnail=?, course_type=?, pdf_file=?, preview_text=?
      WHERE id=?
    `,
        [
          updatedTitle,
          updatedInstructor,
          updatedDesc,
          updatedTelLink,
          updatedPrice,
          updatedIsActive,
          updatedThumbnail,
          updatedType,
          updatedPdf,
          updatedPreview,
          courseId,
        ],
      );

      res.json({ message: "Course updated successfully!" });
    } catch (err) {
      res.status(500).json({ error: "Database error." });
    }
  },
);

// Toggle course visibility
app.post("/api/admin/courses/:id/toggle", adminRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  try {
    const database = await getDbConnection();
    const course = await database.get(
      "SELECT is_active FROM courses WHERE id=?",
      [courseId],
    );
    if (!course) {
      return res.status(404).json({ error: "Course not found." });
    }
    const newStatus = course.is_active ? 0 : 1;
    await database.run("UPDATE courses SET is_active=? WHERE id=?", [
      newStatus,
      courseId,
    ]);
    res.json({ message: "Course visibility updated!" });
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// Delete Course
app.delete("/api/admin/courses/:id", adminRequired, async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  try {
    const database = await getDbConnection();
    await database.run("DELETE FROM purchases WHERE course_id=?", [courseId]);
    await database.run("DELETE FROM courses WHERE id=?", [courseId]);
    res.json({ message: "Course deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// View students
app.get("/api/admin/students", adminRequired, async (req, res) => {
  try {
    const database = await getDbConnection();
    const students = await database.all(`
      SELECT users.id, users.name, users.email,
             COUNT(purchases.id) as total_purchases,
             SUM(CASE WHEN purchases.status='approved' THEN 1 ELSE 0 END) as approved_courses
      FROM users
      LEFT JOIN purchases ON users.id = purchases.user_id
      GROUP BY users.id
      ORDER BY users.id DESC
    `);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Database error." });
  }
});

// Sitemap and robots for indexing
app.get("/sitemap.xml", async (req, res) => {
  try {
    const database = await getDbConnection();
    const courses = await database.all(
      "SELECT id FROM courses ORDER BY id ASC",
    );
    const siteUrl = (
      process.env.SITE_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/+$/, "");
    const staticRoutes = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/about", priority: "0.7", changefreq: "monthly" },
      { loc: "/courses", priority: "0.9", changefreq: "daily" },
      { loc: "/login", priority: "0.4", changefreq: "yearly" },
      { loc: "/register", priority: "0.4", changefreq: "yearly" },
    ];
    const entries = [
      ...staticRoutes.map(
        (route) => `
  <url>
    <loc>${siteUrl}${route.loc}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
      ),
      ...courses.map(
        (course) => `
  <url>
    <loc>${siteUrl}/course/${course.id}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
      ),
    ];

    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}
</urlset>`);
  } catch (err) {
    res.status(500).send("Unable to generate sitemap.");
  }
});

app.get("/robots.txt", (req, res) => {
  const siteUrl = (
    process.env.SITE_URL || `${req.protocol}://${req.get("host")}`
  ).replace(/\/+$/, "");
  res.type("text/plain").send(`User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`);
});

// ==============================================================
// SERVE COMPILED CLIENT (Production Mode)
// ==============================================================
if (
  process.env.NODE_ENV === "production" ||
  fs.existsSync(path.join(__dirname, "client/dist"))
) {
  app.use(express.static(path.join(__dirname, "client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/dist/index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send(
      "YVN Academy API is running. Start the React dev server to view the frontend!",
    );
  });
}

// Health check endpoint (useful for Render / uptime checks)
app.get("/_health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
  });
});

// Secure one-time migration trigger (POST /_migrate)
// Protect by header 'x-migrate-secret' which must match MIGRATE_SECRET env var or SECRET_KEY
let migrationHasRun = false;
app.post("/_migrate", async (req, res) => {
  const secret = req.header("x-migrate-secret");
  const expected = process.env.MIGRATE_SECRET || process.env.SECRET_KEY;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (migrationHasRun) {
    return res
      .status(409)
      .json({ error: "Migration already run in this process" });
  }

  // require here to keep startup lightweight
  try {
    const { migrate } = require("./scripts/migrate-lib");
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl)
      return res.status(500).json({ error: "DATABASE_URL not configured" });
    migrationHasRun = true;
    await migrate(databaseUrl);
    return res.json({ message: "Migration completed" });
  } catch (err) {
    migrationHasRun = false;
    console.error("Migration endpoint error:", err);
    return res
      .status(500)
      .json({ error: "Migration failed", details: String(err) });
  }
});

// Start Server
app.listen(PORT, async () => {
  try {
    await getDbConnection();
    console.log(`Database connected successfully.`);
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    console.error("Database connection failed:", err);
  }
});
