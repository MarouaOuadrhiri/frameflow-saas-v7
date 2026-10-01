const mysql = require('mysql2/promise');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'frameflow',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return DATE/DATETIME/TIMESTAMP columns as plain 'YYYY-MM-DD[ HH:MM:SS]' strings
  // so JSON responses stay predictable across timezones.
  dateStrings: true,
  charset: 'utf8mb4_unicode_ci',
});

module.exports = pool;
