const crypto = require('crypto');

// Hash password usando PBKDF2 (sicuro, built-in Node.js)
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Verifica password
const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Genera ID univoco
const generateId = () => {
  return crypto.randomUUID();
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateId
};
