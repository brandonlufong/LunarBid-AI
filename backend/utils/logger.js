// Minimal structured logger: JSON lines in production, readable text in development.
// Personal data (emails, message bodies) should not be passed to it.
const isProd = process.env.NODE_ENV === 'production';
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[process.env.LOG_LEVEL] || (isProd ? LEVELS.info : LEVELS.debug);

function write(level, fields, msg) {
  if (LEVELS[level] < threshold) return;
  if (typeof fields === 'string') [fields, msg] = [{}, fields];
  const data = { ...fields };
  if (data.err instanceof Error) data.err = { message: data.err.message, stack: data.err.stack };
  const line = isProd
    ? JSON.stringify({ level, time: new Date().toISOString(), msg, ...data })
    : `${level.toUpperCase().padEnd(5)} ${msg}${Object.keys(data).length ? ' ' + JSON.stringify(data) : ''}`;
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}

module.exports = {
  debug: (f, m) => write('debug', f, m),
  info: (f, m) => write('info', f, m),
  warn: (f, m) => write('warn', f, m),
  error: (f, m) => write('error', f, m),
};
