const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/omi-quotazioni-modena.json');

const CATEGORY_LABELS = {
  appartamento: 'Appartamento',
  casa: 'Casa',
  villa: 'Villa',
  ufficio: 'Ufficio',
  negozio: 'Negozio',
  terreno: 'Terreno'
};

const STATE_FACTORS = {
  nuovo: { label: 'Nuovo / in costruzione', value: 1.12 },
  ristrutturato: { label: 'Ristrutturato', value: 1.07 },
  buono: { label: 'Buono stato', value: 1 },
  da_ristrutturare: { label: 'Da ristrutturare', value: 0.78 }
};

const FLOOR_FACTORS = {
  seminterrato: { label: 'Seminterrato', value: 0.88 },
  terra: { label: 'Piano terra', value: 0.95 },
  intermedio: { label: 'Piano intermedio', value: 1 },
  alto: { label: 'Piano alto', value: 1.03 },
  attico: { label: 'Attico / ultimo piano', value: 1.08 }
};

const EXTRA_FACTORS = {
  ascensore: { label: 'Ascensore', value: 0.03 },
  balcone: { label: 'Balcone / terrazzo', value: 0.03 },
  garage: { label: 'Garage / posto auto', value: 0.05 },
  giardino: { label: 'Giardino', value: 0.05 },
  cantina: { label: 'Cantina', value: 0.015 }
};

let datasetCache = null;

function loadDataset() {
  if (datasetCache) return datasetCache;

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  datasetCache = JSON.parse(raw);
  return datasetCache;
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function roundTo(value, step = 1000) {
  return Math.round(value / step) * step;
}

function roundPriceMq(value) {
  return Math.round(value / 10) * 10;
}

function findComune(dataset, citta) {
  const wanted = normalize(citta || 'Modena');
  return dataset.comuni.find(item => normalize(item.comune) === wanted);
}

function findZone(comune, zonaId) {
  if (!comune) return null;

  const selected = comune.zones.find(zone => zone.id === zonaId);
  if (selected) return selected;

  return comune.zones.find(zone => zone.id === comune.defaultZoneId) || comune.zones[0];
}

function buildFactorBreakdown({ stato, piano, ascensore, pertinenze }) {
  const factors = [];
  let multiplier = 1;

  const stateFactor = STATE_FACTORS[stato] || STATE_FACTORS.buono;
  multiplier *= stateFactor.value;
  factors.push({
    key: 'stato',
    label: stateFactor.label,
    impact: `${Math.round((stateFactor.value - 1) * 100)}%`
  });

  const floorFactor = FLOOR_FACTORS[piano] || FLOOR_FACTORS.intermedio;
  multiplier *= floorFactor.value;
  factors.push({
    key: 'piano',
    label: floorFactor.label,
    impact: `${Math.round((floorFactor.value - 1) * 100)}%`
  });

  const extras = Array.isArray(pertinenze) ? pertinenze : [];
  let extraMultiplier = 1;

  if (ascensore) {
    extraMultiplier += EXTRA_FACTORS.ascensore.value;
    factors.push({
      key: 'ascensore',
      label: EXTRA_FACTORS.ascensore.label,
      impact: `+${Math.round(EXTRA_FACTORS.ascensore.value * 100)}%`
    });
  }

  extras.forEach(extra => {
    const extraFactor = EXTRA_FACTORS[extra];
    if (!extraFactor || extra === 'ascensore') return;

    extraMultiplier += extraFactor.value;
    factors.push({
      key: extra,
      label: extraFactor.label,
      impact: `+${Math.round(extraFactor.value * 100)}%`
    });
  });

  multiplier *= Math.min(extraMultiplier, 1.18);

  return { multiplier, factors };
}

router.get('/zone', (req, res) => {
  const dataset = loadDataset();
  const comune = findComune(dataset, req.query.citta);

  if (!comune) {
    return res.status(404).json({
      message: 'Comune non ancora disponibile per la valutazione.',
      availableComuni: dataset.comuni.map(item => item.comune)
    });
  }

  res.json({
    comune: comune.comune,
    provincia: comune.provincia,
    defaultZoneId: comune.defaultZoneId,
    zones: comune.zones.map(zone => ({
      id: zone.id,
      label: zone.label,
      zoneCode: zone.zoneCode,
      isFallback: Boolean(zone.isFallback)
    })),
    source: {
      name: dataset.sourceName,
      url: dataset.sourceUrl,
      semester: dataset.semester,
      isOfficialImport: Boolean(dataset.isOfficialImport),
      note: dataset.datasetNote
    }
  });
});

router.post('/stima', (req, res) => {
  const dataset = loadDataset();
  const {
    citta = 'Modena',
    zonaId,
    categoria,
    superficie,
    stato = 'buono',
    piano = 'intermedio',
    ascensore = false,
    pertinenze = []
  } = req.body || {};

  const area = Number(superficie);
  if (!Number.isFinite(area) || area <= 0) {
    return res.status(400).json({ message: 'Inserisci una superficie valida.' });
  }

  if (area < 10 || area > 5000) {
    return res.status(400).json({ message: 'La superficie indicata non e coerente.' });
  }

  if (!CATEGORY_LABELS[categoria]) {
    return res.status(400).json({ message: 'Seleziona una tipologia valida.' });
  }

  const comune = findComune(dataset, citta);
  if (!comune) {
    return res.status(404).json({
      message: 'Comune non ancora disponibile per la valutazione.',
      availableComuni: dataset.comuni.map(item => item.comune)
    });
  }

  const zone = findZone(comune, zonaId);
  const quote = zone?.quotazioni?.[categoria];

  if (!zone || !quote) {
    return res.status(404).json({ message: 'Quotazione non disponibile per questa zona o tipologia.' });
  }

  const { multiplier, factors } = buildFactorBreakdown({ stato, piano, ascensore, pertinenze });
  const minMq = roundPriceMq(quote.min * multiplier);
  const maxMq = roundPriceMq(quote.max * multiplier);
  const avgMq = roundPriceMq((minMq + maxMq) / 2);
  const disclaimer = dataset.isOfficialImport
    ? 'Stima indicativa: le quotazioni OMI non sostituiscono una perizia puntuale e non considerano caratteristiche specifiche non inserite.'
    : "Stima indicativa: i dati sono iniziali e pronti per essere sostituiti con la fornitura ufficiale OMI dell'Agenzia Entrate.";

  const valoreMin = roundTo(minMq * area);
  const valoreMax = roundTo(maxMq * area);
  const valoreMedio = roundTo(avgMq * area);

  res.json({
    citta: comune.comune,
    provincia: comune.provincia,
    categoria,
    categoriaLabel: CATEGORY_LABELS[categoria],
    superficie: area,
    zona: {
      id: zone.id,
      label: zone.label,
      zoneCode: zone.zoneCode,
      isFallback: Boolean(zone.isFallback)
    },
    quotazioneBase: {
      minMq: quote.min,
      maxMq: quote.max,
      avgMq: Math.round((quote.min + quote.max) / 2)
    },
    stima: {
      valoreMin,
      valoreMax,
      valoreMedio,
      prezzoMqMin: minMq,
      prezzoMqMax: maxMq,
      prezzoMqMedio: avgMq
    },
    confidence: zone.isFallback ? 'media' : 'buona',
    factors,
    source: {
      name: dataset.sourceName,
      url: dataset.sourceUrl,
      semester: dataset.semester,
      isOfficialImport: Boolean(dataset.isOfficialImport),
      note: dataset.datasetNote
    },
    disclaimer
  });
});

module.exports = router;
