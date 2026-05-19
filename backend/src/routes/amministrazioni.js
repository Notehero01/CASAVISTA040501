const express = require('express');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/db');
const { auth, adminOnly } = require('../middleware/auth');

// Get all amministrazioni
router.get('/', (req, res) => {
  try {
    const { citta, servizi } = req.query;
    const users = readData('users');
    const amministrazioniData = readData('amministrazioni');

    let amministrazioni = users
      .filter(u => u.tipo === 'amministrazione')
      .map(u => {
        const details = amministrazioniData.find(a => a.userId === u.id);
        return {
          id: u.id,
          nome: u.nome,
          cognome: u.cognome,
          email: u.email,
          telefono: u.telefono,
          createdAt: u.createdAt,
          ...details
        };
      });

    // Filtra per città
    if (citta) {
      amministrazioni = amministrazioni.filter(a => 
        a.citta?.toLowerCase().includes(citta.toLowerCase())
      );
    }

    // Filtra per servizi
    if (servizi) {
      const serviziArray = servizi.split(',');
      amministrazioni = amministrazioni.filter(a => 
        serviziArray.every(s => a.servizi?.includes(s))
      );
    }

    res.json(amministrazioni);
  } catch (error) {
    console.error('Get amministrazioni error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get single amministrazione
router.get('/:id', (req, res) => {
  try {
    const users = readData('users');
    const amministrazioniData = readData('amministrazioni');
    
    const user = users.find(u => u.id === req.params.id && u.tipo === 'amministrazione');
    
    if (!user) {
      return res.status(404).json({ message: 'Amministrazione non trovata.' });
    }

    const details = amministrazioniData.find(a => a.userId === user.id);

    res.json({
      id: user.id,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      telefono: user.telefono,
      createdAt: user.createdAt,
      ...details
    });
  } catch (error) {
    console.error('Get amministrazione error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Create/Update amministrazione profile
router.post('/profile', auth, (req, res) => {
  try {
    if (req.user.tipo !== 'amministrazione') {
      return res.status(403).json({ message: 'Solo per amministrazioni.' });
    }

    const {
      ragioneSociale,
      descrizione,
      citta,
      indirizzo,
      sitoWeb,
      servizi,
      annoFondazione,
      condominiGestiti
    } = req.body;

    const amministrazioni = readData('amministrazioni');
    const index = amministrazioni.findIndex(a => a.userId === req.user.id);

    const profileData = {
      userId: req.user.id,
      ragioneSociale: ragioneSociale || `${req.user.nome} ${req.user.cognome}`,
      descrizione: descrizione || '',
      citta: citta || '',
      indirizzo: indirizzo || '',
      sitoWeb: sitoWeb || '',
      servizi: Array.isArray(servizi) ? servizi : [],
      annoFondazione: annoFondazione ? parseInt(annoFondazione) : null,
      condominiGestiti: condominiGestiti ? parseInt(condominiGestiti) : 0,
      rating: 0,
      recensioni: 0,
      updatedAt: new Date().toISOString()
    };

    if (index === -1) {
      profileData.createdAt = new Date().toISOString();
      amministrazioni.push(profileData);
    } else {
      amministrazioni[index] = { ...amministrazioni[index], ...profileData };
    }

    writeData('amministrazioni', amministrazioni);

    res.json({
      message: 'Profilo aggiornato.',
      profile: index === -1 ? profileData : amministrazioni[index]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Admin: verify amministrazione
router.put('/:id/verify', auth, adminOnly, (req, res) => {
  try {
    const amministrazioni = readData('amministrazioni');
    const index = amministrazioni.findIndex(a => a.userId === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Amministrazione non trovata.' });
    }

    amministrazioni[index].verified = true;
    amministrazioni[index].verifiedAt = new Date().toISOString();
    writeData('amministrazioni', amministrazioni);

    res.json({ message: 'Amministrazione verificata.' });
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
