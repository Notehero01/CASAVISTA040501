const express = require('express');
const router = express.Router();
const { readData, writeData, generateId } = require('../utils/db');
const { auth, optionalAuth } = require('../middleware/auth');

const MAX_IMAGES_PER_ANNUNCIO = 30;
const ALLOWED_TIPI = new Set(['vendita', 'affitto']);
const ALLOWED_CATEGORIE = new Set(['appartamento', 'casa', 'villa', 'ufficio', 'negozio', 'terreno']);
const ALLOWED_CLASSI = new Set(['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G']);
const ALLOWED_STATI = new Set(['nuovo', 'ristrutturato', 'buono', 'da_ristrutturare']);
const ALLOWED_RISCALDAMENTO = new Set(['autonomo', 'centralizzato', 'pompa_di_calore', 'nessuno']);

function cleanText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function parseNumberField(value, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false, optional = false } = {}) {
  if (value === undefined || value === null || value === '') return optional ? null : NaN;
  const parsed = integer ? parseInt(value, 10) : parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return NaN;
  return parsed;
}

function optionalEnum(value, allowedValues) {
  if (value === undefined || value === null || value === '') return null;
  return allowedValues.has(value) ? value : undefined;
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function cleanPhone(value) {
  return String(value || '').replace(/[^\d+]/g, '').slice(0, 20);
}

function cleanImages(images) {
  if (!Array.isArray(images)) return [];

  const allowedPrefixes = [
    '/uploads/',
    'https://casavista.it/uploads/',
    'https://www.casavista.it/uploads/',
    process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/` : null
  ].filter(Boolean);

  return images
    .map(item => String(item || '').trim())
    .filter(item => item.length <= 500 && allowedPrefixes.some(prefix => item.startsWith(prefix)))
    .slice(0, MAX_IMAGES_PER_ANNUNCIO);
}

function cleanCaratteristiche(caratteristiche) {
  if (!Array.isArray(caratteristiche)) return [];

  return [...new Set(
    caratteristiche
      .map(item => cleanText(item, 60))
      .filter(Boolean)
  )].slice(0, 60);
}

function cleanCoordinate(coordinate) {
  if (!coordinate || typeof coordinate !== 'object') return null;

  const lat = Number(coordinate.lat);
  const lng = Number(coordinate.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

function validateAnnuncioPayload(body, { partial = false } = {}) {
  const errors = [];
  const cleaned = {};
  const has = field => Object.prototype.hasOwnProperty.call(body, field);

  if (!partial || has('titolo')) {
    cleaned.titolo = cleanText(body.titolo, 120);
    if (!cleaned.titolo || cleaned.titolo.length < 6) errors.push('Titolo troppo breve.');
  }

  if (!partial || has('descrizione')) {
    cleaned.descrizione = String(body.descrizione || '').trim().slice(0, 5000);
    if (!cleaned.descrizione || cleaned.descrizione.length < 20) errors.push('Descrizione troppo breve.');
  }

  if (!partial || has('prezzo')) {
    cleaned.prezzo = parseNumberField(body.prezzo, { min: 1, max: 100000000 });
    if (!Number.isFinite(cleaned.prezzo)) errors.push('Prezzo non valido.');
  }

  if (!partial || has('superficie')) {
    cleaned.superficie = parseNumberField(body.superficie, { min: 1, max: 100000 });
    if (!Number.isFinite(cleaned.superficie)) errors.push('Superficie non valida.');
  }

  if (!partial || has('tipo')) {
    cleaned.tipo = body.tipo;
    if (!ALLOWED_TIPI.has(cleaned.tipo)) errors.push('Tipo annuncio non valido.');
  }

  if (!partial || has('categoria')) {
    cleaned.categoria = body.categoria;
    if (!ALLOWED_CATEGORIE.has(cleaned.categoria)) errors.push('Categoria non valida.');
  }

  if (!partial || has('locali')) {
    cleaned.locali = parseNumberField(body.locali, { min: 0, max: 100, integer: true, optional: partial });
    if (cleaned.locali !== null && !Number.isFinite(cleaned.locali)) errors.push('Numero locali non valido.');
  }

  if (!partial || has('camere')) {
    cleaned.camere = parseNumberField(body.camere, { min: 0, max: 100, integer: true, optional: partial });
    if (cleaned.camere !== null && !Number.isFinite(cleaned.camere)) errors.push('Numero camere non valido.');
  }

  if (!partial || has('bagni')) {
    cleaned.bagni = parseNumberField(body.bagni, { min: 0, max: 100, integer: true, optional: partial });
    if (cleaned.bagni !== null && !Number.isFinite(cleaned.bagni)) errors.push('Numero bagni non valido.');
  }

  if (has('piano')) {
    cleaned.piano = parseNumberField(body.piano, { min: -10, max: 200, integer: true, optional: true });
    if (cleaned.piano !== null && !Number.isFinite(cleaned.piano)) errors.push('Piano non valido.');
  }

  if (has('anno_costruzione')) {
    const maxYear = new Date().getFullYear() + 5;
    cleaned.anno_costruzione = parseNumberField(body.anno_costruzione, { min: 1700, max: maxYear, integer: true, optional: true });
    if (cleaned.anno_costruzione !== null && !Number.isFinite(cleaned.anno_costruzione)) errors.push('Anno costruzione non valido.');
  }

  if (!partial || has('indirizzo')) {
    cleaned.indirizzo = cleanText(body.indirizzo, 180);
    if (!partial && !cleaned.indirizzo) errors.push('Indirizzo obbligatorio.');
  }

  if (!partial || has('citta')) {
    cleaned.citta = cleanText(body.citta, 80);
    if (!cleaned.citta) errors.push('Citta obbligatoria.');
  }

  if (has('cap')) cleaned.cap = cleanText(body.cap, 10);
  if (has('provincia')) cleaned.provincia = cleanText(body.provincia, 2).toUpperCase();
  if (has('coordinate')) cleaned.coordinate = cleanCoordinate(body.coordinate);
  if (has('immagini')) cleaned.immagini = cleanImages(body.immagini);
  if (has('caratteristiche')) cleaned.caratteristiche = cleanCaratteristiche(body.caratteristiche);

  if (has('classe_energetica')) {
    cleaned.classe_energetica = optionalEnum(body.classe_energetica, ALLOWED_CLASSI);
    if (cleaned.classe_energetica === undefined) errors.push('Classe energetica non valida.');
  }

  if (has('stato')) {
    cleaned.stato = optionalEnum(body.stato, ALLOWED_STATI);
    if (cleaned.stato === undefined) errors.push('Stato immobile non valido.');
  }

  if (has('riscaldamento')) {
    cleaned.riscaldamento = optionalEnum(body.riscaldamento, ALLOWED_RISCALDAMENTO);
    if (cleaned.riscaldamento === undefined) errors.push('Riscaldamento non valido.');
  }

  if (!partial || has('nome_contatto')) {
    cleaned.nome_contatto = cleanText(body.nome_contatto, 120);
  }

  if (!partial || has('telefono_contatto')) {
    cleaned.telefono_contatto = cleanPhone(body.telefono_contatto);
  }

  if (has('email_contatto')) {
    cleaned.email_contatto = cleanText(body.email_contatto, 160).toLowerCase();
    if (!isValidEmail(cleaned.email_contatto)) errors.push('Email contatto non valida.');
  }

  return { cleaned, errors };
}

// Funzione per generare slug
function generateSlug(titolo, id) {
  const slugified = titolo
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
  return `${slugified}-${id}`;
}

// Funzione per calcolare distanza (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raggio Terra in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseAreaPolygon(area) {
  if (!area) return null;

  try {
    const parsed = typeof area === 'string' ? JSON.parse(area) : area;
    if (!Array.isArray(parsed) || parsed.length < 3 || parsed.length > 80) return null;

    const points = parsed
      .map(point => ({ lat: Number(point.lat), lng: Number(point.lng) }))
      .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    return points.length >= 3 ? points : null;
  } catch {
    return null;
  }
}

function pointInPolygon(point, polygon) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersects = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function isPublicAnnuncio(annuncio) {
  const status = annuncio.moderationStatus || 'published';
  return !annuncio.deletedAt && status === 'published';
}

function canViewAnnuncio(annuncio, user) {
  if (isPublicAnnuncio(annuncio)) return true;
  if (!user || annuncio.deletedAt || annuncio.moderationStatus === 'deleted') return false;
  return annuncio.userId === user.id || user.tipo === 'admin';
}

// Get featured annunci
router.get('/featured/list', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const featured = annunci
      .filter(isPublicAnnuncio)
      .sort((a, b) => (b.visualizzazioni || 0) - (a.visualizzazioni || 0))
      .slice(0, 6);
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get recent annunci
router.get('/recent/list', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const recent = annunci
      .filter(isPublicAnnuncio)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
    res.json(recent);
  } catch (error) {
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get annunci owned by current user
router.get('/me/list', auth, async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const owned = annunci
      .filter(annuncio => annuncio.userId === req.user.id && annuncio.moderationStatus !== 'deleted' && !annuncio.deletedAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(owned);
  } catch (error) {
    console.error('Get own annunci error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get all annunci (con filtri avanzati)
router.get('/', async (req, res) => {
  try {
    const { 
      tipo, 
      categoria, 
      citta, 
      prezzoMin, 
      prezzoMax, 
      superficieMin, 
      superficieMax,
      localiMin,
      camereMin,
      bagniMin,
      stato,
      classeEnergetica,
      riscaldamento,
      annoCostruzioneMin,
      annoCostruzioneMax,
      caratteristiche,
      lat,
      lng,
      raggioKm,
      area,
      page = 1,
      limit = 20
    } = req.query;

    let annunci = (await readData('annunci')).filter(isPublicAnnuncio);

    // Applica filtri base
    if (tipo) annunci = annunci.filter(a => a.tipo === tipo);
    if (categoria) annunci = annunci.filter(a => a.categoria === categoria);
    if (citta) annunci = annunci.filter(a => (a.citta || '').toLowerCase().includes(citta.toLowerCase()));
    if (prezzoMin) annunci = annunci.filter(a => a.prezzo >= parseInt(prezzoMin));
    if (prezzoMax) annunci = annunci.filter(a => a.prezzo <= parseInt(prezzoMax));
    if (superficieMin) annunci = annunci.filter(a => a.superficie >= parseInt(superficieMin));
    if (superficieMax) annunci = annunci.filter(a => a.superficie <= parseInt(superficieMax));
    if (localiMin) annunci = annunci.filter(a => a.locali >= parseInt(localiMin));
    if (camereMin) annunci = annunci.filter(a => a.camere >= parseInt(camereMin));
    if (bagniMin) annunci = annunci.filter(a => a.bagni >= parseInt(bagniMin));
    
    // Filtri avanzati
    if (stato) annunci = annunci.filter(a => a.stato === stato);
    if (classeEnergetica) annunci = annunci.filter(a => a.classe_energetica === classeEnergetica);
    if (riscaldamento) annunci = annunci.filter(a => a.riscaldamento === riscaldamento);
    if (annoCostruzioneMin) annunci = annunci.filter(a => a.anno_costruzione >= parseInt(annoCostruzioneMin));
    if (annoCostruzioneMax) annunci = annunci.filter(a => a.anno_costruzione <= parseInt(annoCostruzioneMax));
    
    // Filtro caratteristiche
    if (caratteristiche) {
      const carArray = caratteristiche.split(',');
      annunci = annunci.filter(a => 
        carArray.every(car => a.caratteristiche && a.caratteristiche.includes(car))
      );
    }
    
    // Ricerca per raggio
    if (lat && lng && raggioKm) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radius = parseFloat(raggioKm);
      
      annunci = annunci.filter(a => {
        if (!a.coordinate || !a.coordinate.lat || !a.coordinate.lng) return false;
        const dist = calculateDistance(userLat, userLng, a.coordinate.lat, a.coordinate.lng);
        return dist <= radius;
      });
    }

    // Ordina per data (più recenti prima)
    if (area) {
      const areaPolygon = parseAreaPolygon(area);

      if (!areaPolygon) {
        return res.status(400).json({ message: 'Area disegnata non valida.' });
      }

      annunci = annunci.filter(a =>
        a.coordinate &&
        Number.isFinite(Number(a.coordinate.lat)) &&
        Number.isFinite(Number(a.coordinate.lng)) &&
        pointInPolygon({ lat: Number(a.coordinate.lat), lng: Number(a.coordinate.lng) }, areaPolygon)
      );
    }

    annunci.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedAnnunci = annunci.slice(startIndex, endIndex);

    res.json({
      annunci: paginatedAnnunci,
      total: annunci.length,
      page: parseInt(page),
      pages: Math.ceil(annunci.length / limit)
    });
  } catch (error) {
    console.error('Get annunci error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Get single annuncio (supporta sia ID che slug)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const { id } = req.params;
    
    // Cerca per ID o slug
    const annuncio = annunci.find(a => (a.id === id || a.slug === id) && canViewAnnuncio(a, req.user));

    if (!annuncio) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    res.json(annuncio);
  } catch (error) {
    console.error('Get annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Incrementa visualizzazioni (endpoint separato)
router.post('/:id/views', async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const { id } = req.params;
    
    const annuncio = annunci.find(a => (a.id === id || a.slug === id) && isPublicAnnuncio(a));
    if (!annuncio) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    annuncio.visualizzazioni = (annuncio.visualizzazioni || 0) + 1;
    await writeData('annunci', annunci);

    res.json({ visualizzazioni: annuncio.visualizzazioni });
  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Create annuncio (richiede auth)
router.post('/', auth, async (req, res) => {
  try {
    const { cleaned, errors } = validateAnnuncioPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const annunci = await readData('annunci');
    const newId = generateId();
    
    const newAnnuncio = {
      id: newId,
      slug: generateSlug(cleaned.titolo, newId),
      titolo: cleaned.titolo,
      descrizione: cleaned.descrizione,
      prezzo: cleaned.prezzo,
      tipo: cleaned.tipo,
      categoria: cleaned.categoria,
      superficie: cleaned.superficie,
      locali: cleaned.locali || 0,
      camere: cleaned.camere || 0,
      bagni: cleaned.bagni || 0,
      piano: cleaned.piano ?? null,
      indirizzo: cleaned.indirizzo || '',
      citta: cleaned.citta,
      cap: cleaned.cap || '',
      provincia: cleaned.provincia || '',
      coordinate: cleaned.coordinate || null,
      immagini: cleaned.immagini || [],
      caratteristiche: cleaned.caratteristiche || [],
      classe_energetica: cleaned.classe_energetica || null,
      stato: cleaned.stato || null,
      riscaldamento: cleaned.riscaldamento || null,
      anno_costruzione: cleaned.anno_costruzione ?? null,
      nome_contatto: cleaned.nome_contatto || req.user.nome,
      telefono_contatto: cleaned.telefono_contatto || req.user.telefono,
      email_contatto: cleaned.email_contatto || req.user.email,
      userId: req.user.id,
      moderationStatus: req.user.tipo === 'admin' ? 'published' : 'pending',
      reviewRequestedAt: new Date().toISOString(),
      approvedAt: req.user.tipo === 'admin' ? new Date().toISOString() : null,
      approvedBy: req.user.tipo === 'admin' ? req.user.id : null,
      visualizzazioni: 0,
      contattiRicevuti: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    annunci.push(newAnnuncio);
    await writeData('annunci', annunci);

    res.status(201).json({
      message: req.user.tipo === 'admin'
        ? 'Annuncio pubblicato.'
        : 'Annuncio inviato in revisione. Sara visibile dopo approvazione admin.',
      annuncio: newAnnuncio
    });
  } catch (error) {
    console.error('Create annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Update annuncio
router.put('/:id', auth, async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const index = annunci.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    // Verifica proprietario o admin
    if (annunci[index].userId !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato.' });
    }

    const existingAnnuncio = annunci[index];
    const updateBody = { ...req.body };
    [
      'id',
      'userId',
      'moderationStatus',
      'approvedAt',
      'approvedBy',
      'hiddenAt',
      'rejectedAt',
      'rejectedBy',
      'deletedAt',
      'reviewedAt',
      'reviewedBy',
      'visualizzazioni',
      'contattiRicevuti',
      'createdAt',
      'updatedAt',
      'owner'
    ].forEach(field => delete updateBody[field]);

    const { cleaned, errors } = validateAnnuncioPayload(updateBody, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    if (cleaned.titolo && cleaned.titolo !== existingAnnuncio.titolo) {
      cleaned.slug = generateSlug(cleaned.titolo, existingAnnuncio.id);
    }

    const userIsAdmin = req.user.tipo === 'admin';
    const moderationUpdate = userIsAdmin
      ? {}
      : {
          moderationStatus: 'pending',
          reviewRequestedAt: new Date().toISOString(),
          approvedAt: null,
          approvedBy: null,
          hiddenAt: null,
          rejectedAt: null,
          rejectedBy: null
        };

    annunci[index] = {
      ...existingAnnuncio,
      ...cleaned,
      ...moderationUpdate,
      updatedAt: new Date().toISOString()
    };

    await writeData('annunci', annunci);

    res.json({
      message: userIsAdmin
        ? 'Annuncio aggiornato.'
        : 'Annuncio aggiornato e rimesso in revisione.',
      annuncio: annunci[index]
    });
  } catch (error) {
    console.error('Update annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

// Delete annuncio
router.delete('/:id', auth, async (req, res) => {
  try {
    const annunci = await readData('annunci');
    const index = annunci.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ message: 'Annuncio non trovato.' });
    }

    // Verifica proprietario o admin
    if (annunci[index].userId !== req.user.id && req.user.tipo !== 'admin') {
      return res.status(403).json({ message: 'Non autorizzato.' });
    }

    annunci.splice(index, 1);
    await writeData('annunci', annunci);

    res.json({ message: 'Annuncio eliminato.' });
  } catch (error) {
    console.error('Delete annuncio error:', error);
    res.status(500).json({ message: 'Errore del server.' });
  }
});

module.exports = router;
