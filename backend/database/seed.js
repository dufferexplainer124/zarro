// Creates/updates the default admin account.
// Usage: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function run() {
  const email = 'admin@zarro.com';
  const plainPassword = 'Admin@123';
  const hashed = await bcrypt.hash(plainPassword, 10);

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  if (existing.length) {
    await pool.query('UPDATE users SET password = ?, role = ? WHERE email = ?', [hashed, 'admin', email]);
    console.log(`Updated existing admin: ${email}`);
  } else {
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Zarro Admin', email, hashed, 'admin']
    );
    console.log(`Created admin: ${email} / password: ${plainPassword}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
