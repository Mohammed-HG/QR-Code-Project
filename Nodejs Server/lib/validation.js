const { HttpError } = require('./errors');
function object(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new HttpError(400, 'A JSON object is required.');
  return value;
}
function string(value, label, min = 1, max = 2048) {
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    throw new HttpError(400, label + ' is invalid.');
  }
  return value;
}
function email(value) {
  const result = string(value, 'Email', 3, 254).trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$/i.test(result) || result.startsWith('.') || result.includes('..') || result.includes('.@') || result.split('@')[0].length > 64) throw new HttpError(400, 'Enter a valid email address.');
  return result;
}
function username(value) {
  const result = string(value, 'Username', 3, 32).trim().toLowerCase();
  if (! /^(?=.{3,32}$)[a-z0-9_]+(?: [a-z0-9_]+)*$/.test(result)) throw new HttpError(400, 'Username must contain 3–32 letters, numbers, spaces or underscores.');
  return result;
}
function password(value, creating = false) {
  string(value, 'Password', creating ? 12 : 1, 72);
  if (Buffer.byteLength(value, 'utf8') > 72) throw new HttpError(400, 'Password must be at most 72 UTF-8 bytes.');
  return value;
}
function token(value, label = 'Token') {
  const result = string(value, label, 64, 64);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new HttpError(400, label + ' is invalid.');
  return result;
}
module.exports = { object, string, email, username, password, token };
