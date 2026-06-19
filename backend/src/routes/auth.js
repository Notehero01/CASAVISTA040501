const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/db');
const { hashPassword, verifyPassword } = require('../utils/crypto');
const { sendEmail } = require('../utils/email');
const { buildAgencyProfile } = require('../utils/agency');

function getClientOrigin() {
  const origin = (process.env.CLIENT_ORIGIN || 'https://casavista.it')
    .split(',')[0]
    .trim();
  return origin || 'https://casavista.it';
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, nome, cognome, telefono, tipo = 'utente', privacyConsent, ragioneSociale } = req.body;
    const accountType = ['utente', 'amministrazione'].includes(tipo) ? tipo : 'utente';
    const agencyName = String(ragioneSociale || nome || '').trim();
    const firstName = accountType === 'amministrazione' ? agencyName : String(nome || '').trim();
    const lastName = accountType === 'amministrazione' ? String(cognome || 'Agenzia').trim() : String(cognome || '').trim();

    // Validazione
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La password deve essere di almeno 6 caratteri.' });
    }

    if (!privacyConsent) {
      return res.status(400).json({ message: 'Devi accettare Privacy Policy e Termini per registrarti.' });
    }

    const users = await readData('users');

    // Verifica email esistente
    if (users.find(u => u.email === email.toLowerCase())) {
      return res.status(400).json({ message: 'Email già registrata.' });
    }

    // Crea utente
    const newUser = {
      id: generateId(),
      email: email.toLowerCase(),
      password: hashPassword(password),
      nome: firstName,
      cognome: lastName,
      telefono: telefono || null,
      tipo: accountType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: false,
      blocked: false,
      privacyConsentAt: new Date().toISOString(),
      privacyConsentVersion: '2026-06-16',
      avatar: null
    };

    users.push(newUser);
    await writeData('users', users);

    if (accountType === 'amministrazione') {
      const amministrazioni = await readData('amministrazioni');
      if (!amministrazioni.find(profile => profile.userId === newUser.id)) {
        amministrazioni.push({
          userId: newUser.id,
          ragioneSociale: agencyName,
          descrizione: '',
          citta: '',
          provincia: '',
          indirizzo: '',
          sitoWeb: '',
          telefono: telefono || '',
          whatsapp: '',
          logo: '',
          coverImage: '',
          servizi: [],
          annoFondazione: null,
          condominiGestiti: 0,
          rating: 0,
          recensioni: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await writeData('amministrazioni', amministrazioni);
      }
    }

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

    const users = await readData('users');
    const user = users.find(u => u.email === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    if (user.blocked) {
      return res.status(403).json({ message: 'Account bloccato. Contatta CasaVista.' });
    }

    const isValid = verifyPassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }

    // Aggiorna ultimo accesso
    user.lastLogin = new Date().toISOString();
    await writeData('users', users);

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

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email obbligatoria.' });
    }

    const users = await readData('users');
    const user = users.find(u => u.email === email.toLowerCase());

    if (user) {
      const reset = createPasswordResetToken();
      user.passwordResetToken = reset.tokenHash;
      user.passwordResetExpires = reset.expiresAt;
      user.updatedAt = new Date().toISOString();
      await writeData('users', users);

      const resetLink = `${getClientOrigin()}/reimposta-password/${reset.token}`;
      sendEmail(user.email, 'passwordReset', [resetLink]).catch(err => {
        console.log('Password reset email failed:', err.message);
      });
    }

    res.json({
      message: 'Se l\'email risulta registrata, riceverai un link per reimpostare la password.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token e nuova password sono obbligatori.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La password deve essere di almeno 6 caratteri.' });
    }

    const users = await readData('users');
    const tokenHash = hashResetToken(token);
    const user = users.find(u =>
      u.passwordResetToken === tokenHash &&
      u.passwordResetExpires &&
      new Date(u.passwordResetExpires).getTime() > Date.now()
    );

    if (!user) {
      return res.status(400).json({ message: 'Link non valido o scaduto.' });
    }

    user.password = hashPassword(password);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.updatedAt = new Date().toISOString();
    await writeData('users', users);

    res.json({ message: 'Password aggiornata. Ora puoi accedere.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').auth, (req, res) => {
  res.json({ user: req.user });
});

// Get public user info (per badge verificato)
router.get('/user/:id', async (req, res) => {
  try {
    const users = await readData('users');
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato.' });
    }
    
    const publicUser = {
      id: user.id,
      nome: user.nome,
      cognome: user.cognome,
      isVerified: user.verified || false,
      isAgency: user.tipo === 'amministrazione',
      createdAt: user.createdAt
    };

    if (user.tipo === 'amministrazione') {
      const amministrazioniData = await readData('amministrazioni');
      const annunci = await readData('annunci');
      const details = amministrazioniData.find(a => a.userId === user.id);
      const agency = buildAgencyProfile(user, details, annunci);

      publicUser.slug = agency.slug;
      publicUser.displayName = agency.displayName;
      publicUser.ragioneSociale = agency.ragioneSociale;
      publicUser.logo = agency.logo;
      publicUser.annunciCount = agency.annunciCount;
    }

    // Ritorna solo info pubbliche
    res.json(publicUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Update profile
router.put('/profile', require('../middleware/auth').auth, async (req, res) => {
  try {
    const { nome, cognome, telefono } = req.body;
    const users = await readData('users');
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

    await writeData('users', users);

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
