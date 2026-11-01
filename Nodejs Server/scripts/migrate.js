const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const { createPool } = require('../db');
async function migrate(pool) {
  const sql = await fs.readFile(path.join(__dirname, '..', 'migrations', '001-auth.sql'), 'utf8');
  for (const statement of sql.split(';').map(part => part.trim()).filter(Boolean)) await pool.query(statement);
  // Apply constraints to existing users tables too. Fail on duplicates; never delete user data.
  for (const [name, column] of [['users_username_unique', 'username'], ['users_email_unique', 'email']]) {
    const [rows] = await pool.execute('SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?', ['users', name]);
    if (!rows.length) await pool.query('ALTER TABLE users ADD UNIQUE KEY ' + name + ' (' + column + ')');
  }
}
if (require.main === module) {
  const pool = createPool();
  migrate(pool).then(() => console.log('Database migrations completed.'))
    .catch(error => { console.error('Migration failed (' + (error.code || 'configuration') + '). Check schema compatibility, duplicates and database access.'); process.exitCode = 1; })
    .finally(() => pool.end());
}
module.exports = { migrate };
