const { configFromEnv } = require('./config');
const { createPool } = require('./db');
const { createRepository } = require('./repository');
const { createMailer } = require('./mailer');
const { migrate } = require('./scripts/migrate');
const { createApp } = require('./app');
async function start() {
  const config = configFromEnv();
  const pool = createPool();
  try {
    let ready = false;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try { await pool.execute('SELECT 1'); ready = true; break; }
      catch { await new Promise(resolve => setTimeout(resolve, 2000)); }
    }
    if (!ready) throw new Error('Database did not become ready.');
    await migrate(pool);
    const repository = createRepository(pool);
    const mailer = createMailer();
    if (!mailer.ready) console.warn('Registration is unavailable until SMTP is configured.');
    await repository.cleanup(Date.now());
    const app = createApp({ repository, mailer, config });
    const server = app.listen(config.port, '0.0.0.0', () => console.log('QR server listening on port ' + config.port));
    const cleanup = setInterval(() => repository.cleanup(Date.now()).catch(() => console.error('Expired auth cleanup failed.')), 60000);
    cleanup.unref();
    server.requestTimeout = 20000;
    server.headersTimeout = 10000;
    let closing = false;
    const stop = () => {
      if (closing) return;
      closing = true;
      clearInterval(cleanup);
      const timeout = setTimeout(() => process.exit(1), 10000);
      timeout.unref();
      server.close(async () => { await pool.end(); clearTimeout(timeout); });
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    server.on('error', async () => { clearInterval(cleanup); await pool.end(); process.exitCode = 1; });
  } catch (error) { await pool.end(); throw error; }
}
if (require.main === module) start().catch(error => { console.error('Startup failed:', error.code || error.message); process.exitCode = 1; });
module.exports = { start };
