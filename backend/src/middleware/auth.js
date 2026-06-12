const jwt = require('jsonwebtoken');
const { readData } = require('../utils/db');

// Verifica token JWT
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Accesso negato. Token mancante.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verifica che l'utente esista ancora
    const users = await readData('users');
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Utente non trovato.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      tipo: user.tipo,
      telefono: user.telefono
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token non valido.' });
  }
};

// Verifica admin
const adminOnly = (req, res, next) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ message: 'Accesso riservato agli amministratori.' });
  }
  next();
};

module.exports = { auth, adminOnly };
