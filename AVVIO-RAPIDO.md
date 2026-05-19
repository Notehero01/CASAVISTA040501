# 🚀 AVVIO RAPIDO - casavista.it

## 📦 Il tuo sito è pronto!

Questo pacchetto contiene **CasaVista completo** con tutte le funzionalità.

---

## ⚡ DEPLOY IN 5 MINUTI

### Step 1: Estrai il pacchetto
```bash
tar -xzvf casavista-COMPLETO.tar.gz
cd casavista-prod
```

### Step 2: Configura (2 min)

**Backend** - Modifica `backend/.env`:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=SOSTITUISCI_CON_STRINGA_CASUALE_LUNGA_64_CARATTERI
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@casavista.it
ADMIN_PASSWORD=CasaVista2024!Admin#Secure
```

**Frontend** - Crea `frontend/.env`:
```env
VITE_API_URL=/api
VITE_GOOGLE_MAPS_API_KEY=LA_TUA_API_KEY_GOOGLE_MAPS
```

> **Come ottenere Google Maps API Key:**
> 1. Vai su https://console.cloud.google.com/
> 2. Crea progetto → Abilita "Maps JavaScript API"
> 3. Credenziali → Crea API Key

### Step 3: Deploy su Railway (3 min)

```bash
# Inizializza Git
git init
git add .
git commit -m "CasaVista v1.0"
git branch -M main

# Crea repo su GitHub (manualmente dal sito)
# Poi:
git remote add origin https://github.com/TUO_USERNAME/casavista.git
git push -u origin main
```

Vai su https://railway.app:
1. Login con GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Seleziona `casavista`
4. In "Variables" aggiungi le stesse variabili del file `.env`
5. Attendi 2 minuti

### Step 4: Collega dominio (1 min)

In Railway:
- Settings → Domains → Add Custom Domain
- Inserisci: `casavista.it`
- Copia l'IP fornito

Nel tuo registrar (dove hai comprato il dominio):
```
Tipo: A | Nome: @ | Valore: [IP Railway]
Tipo: A | Nome: www | Valore: [IP Railway]
```

---

## ✅ VERIFICA

Dopo 5-10 minuti, vai su:
- https://casavista.it

**Credenziali Admin:**
- Email: `admin@casavista.it`
- Password: `CasaVista2024!Admin#Secure`

---

## 🛠️ COMANDI UTILI

### Se usi VPS invece di Railway:
```bash
# Sul server
apt update && apt install docker-compose -y
docker-compose up -d
```

### Per aggiornare dopo modifiche:
```bash
git add .
git commit -m "Update"
git push origin main
# Railway si aggiorna automaticamente!
```

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla i log: `docker-compose logs -f`
2. Verifica variabili d'ambiente
3. Controlla che il dominio punti all'IP corretto: `nslookup casavista.it`

---

**🎉 Buon lancio!**
