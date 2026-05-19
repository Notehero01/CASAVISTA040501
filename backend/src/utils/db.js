const fs = require('fs');
const path = require('path');
const { generateId, hashPassword } = require('./crypto');

const DATA_DIR = path.join(__dirname, '../../data');

// Assicurati che la directory esista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// File database
const DB_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  annunci: path.join(DATA_DIR, 'annunci.json'),
  conversations: path.join(DATA_DIR, 'conversations.json'),
  messages: path.join(DATA_DIR, 'messages.json'),
  amministrazioni: path.join(DATA_DIR, 'amministrazioni.json')
};

// Inizializza file se non esistono
Object.values(DB_FILES).forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
  }
});

// Leggi dati
const readData = (table) => {
  try {
    const data = fs.readFileSync(DB_FILES[table], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Scrivi dati
const writeData = (table, data) => {
  fs.writeFileSync(DB_FILES[table], JSON.stringify(data, null, 2));
};

// Inizializza admin
const initAdmin = () => {
  const users = readData('users');
  const adminExists = users.find(u => u.email === process.env.ADMIN_EMAIL);
  
  if (!adminExists) {
    const adminUser = {
      id: generateId(),
      email: process.env.ADMIN_EMAIL,
      password: hashPassword(process.env.ADMIN_PASSWORD),
      nome: 'Amministratore',
      cognome: 'CasaVista',
      tipo: 'admin',
      telefono: '+39 055 1234567',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: true
    };
    users.push(adminUser);
    writeData('users', users);
    console.log('✅ Admin creato:', process.env.ADMIN_EMAIL);
  }
};

module.exports = {
  readData,
  writeData,
  initAdmin,
  generateId
};
