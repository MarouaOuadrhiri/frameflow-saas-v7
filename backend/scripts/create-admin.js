/**
 * Create a FrameFlow team account (team mode).
 *
 * There is no public sign-up. Run this script ONCE PER TEAMMATE — every
 * account gets full access to the shared workspace: both teammates log in
 * and see/edit everything (projects, clients, finances, equipment, files).
 * Clients of the studio never log in — they are CRM records, not accounts.
 *
 * Usage:
 *   npm run create-admin -- "Full Name" teammate@studio.com secret123
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

async function main() {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -- "Full Name" admin@studio.com secret123');
    process.exit(1);
  }
  if (String(password).length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const [existing] = await pool.query('SELECT `id` FROM `users` WHERE `email` = ?', [email]);
  if (existing.length) {
    console.error('An account with this email already exists.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const initials = String(name)
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();

  await pool.query(
    'INSERT INTO `users` (`name`, `email`, `password_hash`, `initials`) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, initials]
  );

  console.log(`Admin account created: ${email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
