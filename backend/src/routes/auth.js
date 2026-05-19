const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/db');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const { sendEmail } = require('../utils/email');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, nome, cognome, telefono, tipo = 'utente' } = req.body;

    // Validazione
    if (!email || !password || !nome || !cognome) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La password deve essere di almeno 6 caratteri.' });
    }

    const users = readData('users');

    // Verifica email esistente
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Email già registrata.' });
    }

    // Crea utente
    const newUser = {
      id: generateId(),
      email: email.toLowerCase(),
      password: hashPassword(password),
      nome,
      cognome,
      telefono: telefono || null,
      tipo: ['utente', 'amministrazione'].includes(tipo) ? tipo : 'utente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: false,
      avatar: null
    };

    users.push(newUser);
    writeData('users', users);

    // Invia email di benvenuto (non bloccante)
    sendEmail(newUser.email, 'welcome', [newUser.nome]).catch(err => {
      console.log('Welcome email failed:', err.message);
    });

    // Genera token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, tipo: newUser.tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      message: 'Registrazione completata.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nome: newUser.nome,
        cognome: newUser.cognome,
        tipo: newUser.tipo,
        telefono: newUser.telefono
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono obbligatori.' });
    }

    const users = readData('users');
    const user = users.find(u => u.email === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    const isValid = verifyPassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    // Aggiorna ultimo accesso
    user.lastLogin = new Date().toISOString();
    writeData('users', users);

    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Login effettuato.',
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cognome: user.cognome,
        tipo: user.tipo,
        telefono: user.telefono
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').auth, (req, res) => {
  res.json({ user: req.user });
});

// Get public user info (per badge verificato)
router.get('/user/:id', (req, res) => {
  try {
    const users = readData('users');
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }
    
    // Ritorna solo info pubbliche
    res.json({
      id: user.id,
      nome: user.nome,
      cognome: user.cognome,
      isVerified: user.verified || false,
      isAgency: user.tipo === 'amministrazione',
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Update profile
router.put('/profile', require('../middleware/auth').auth, (req, res) => {
  try {
    const { nome, cognome, telefono } = req.body;
    const users = readData('users');
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }

    users[userIndex] = {
      ...users[userIndex],
      nome: nome || users[userIndex].nome,
      cognome: cognome || users[userIndex].cognome,
      telefono: telefono !== undefined ? telefono : users[userIndex].telefono,
      updatedAt: new Date().toISOString()
    };

    writeData('users', users);

    res.json({
      message: 'Profilo aggiornato.',
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        nome: users[userIndex].nome,
        cognome: users[userIndex].cognome,
        tipo: users[userIndex].tipo,
        telefono: users[userIndex].telefono
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
