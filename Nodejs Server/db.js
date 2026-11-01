const mysql = require('mysql2/promise');
function createPool(env = process.env) {
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (!env[key]) throw new Error(key + ' must be configured.');
  }
  if (env.DB_USER === 'root') throw new Error('Use a dedicated database user, not root.');
  return mysql.createPool({
    host: env.DB_HOST, port: Number(env.DB_PORT || 3306), user: env.DB_USER,
    password: env.DB_PASSWORD, database: env.DB_NAME,
    waitForConnections: true, connectionLimit: 10, queueLimit: 50,
    connectTimeout: 10000, timezone: 'Z', dateStrings: false,
    ...(env.DB_SSL_CA ? { ssl: { ca: env.DB_SSL_CA, rejectUnauthorized: true } } : {}),
  });
}
module.exports = { createPool };
