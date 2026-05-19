# 🏠 CasaVista - Portale Immobiliare Professionale

CasaVista è un portale immobiliare completo e pronto per la produzione, con backend Node.js, autenticazione JWT, chat real-time, e gestione amministrazioni condominiali.

## ✨ Caratteristiche

- 🔐 **Autenticazione sicura** con JWT e password hash (PBKDF2)
- 📱 **Responsive design** per tutti i dispositivi
- 💬 **Chat real-time** tra utenti
- 🏢 **Gestione amministrazioni condominiali**
- 📊 **Valutazione immobiliare** e calcolatore mutuo
- 📤 **Upload immagini** con multer
- 🔒 **Sicurezza** con Helmet, rate limiting, CORS

## 🚀 Deployment Rapido

### Opzione 1: Railway/Render (Consigliato)

1. Crea un account su [Railway](https://railway.app) o [Render](https://render.com)
2. Collega il tuo repository GitHub
3. Imposta le variabili d'ambiente:
   ```
   NODE_ENV=production
   JWT_SECRET=tuo-secret-sicuro-lungo-almeno-32-caratteri
   ADMIN_EMAIL=admin@tuodominio.it
   ADMIN_PASSWORD=password-sicura-complessa
   ```
4. Deploy!

### Opzione 2: VPS (Ubuntu)

```bash
# 1. Clona il repository
git clone <repo-url>
cd casavista-prod

# 2. Installa Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Installa PM2
sudo npm install -g pm2

# 4. Configura backend
cd backend
cp .env.example .env
# Modifica .env con le tue impostazioni
npm install
pm2 start src/server.js --name casavista-api

# 5. Configura frontend (opzionale, puoi usare Vercel/Netlify)
cd ../frontend
npm install
npm run build

# 6. Configura Nginx
sudo apt install nginx
# Copia la configurazione da nginx.conf
```

### Opzione 3: Docker

```bash
# Build e avvio
docker-compose up -d

# Stop
docker-compose down
```

## 🔐 Credenziali Admin Predefinite

- **Email:** `admin@casavista.it`
- **Password:** `CasaVista2024!Admin#Secure`

⚠️ **IMPORTANTE:** Cambia la password admin dopo il primo login!

## 📁 Struttura del Progetto

```
casavista-prod/
├── backend/
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, validation
│   │   ├── utils/         # Crypto, DB
│   │   └── server.js      # Entry point
│   ├── data/              # Database JSON
│   ├── uploads/           # Immagini caricate
│   └── .env               # Configurazione
├── frontend/              # React + Vite
└── docker-compose.yml
```

## 🔧 Configurazione Backend (.env)

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=il-tuo-secret-super-sicuro-minimo-32-caratteri
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@tuodominio.it
ADMIN_PASSWORD=password-admin-sicura
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Profilo utente
- `PUT /api/auth/profile` - Aggiorna profilo

### Annunci
- `GET /api/annunci` - Lista annunci (con filtri)
- `GET /api/annunci/:id` - Dettaglio annuncio
- `POST /api/annunci` - Crea annuncio (auth)
- `PUT /api/annunci/:id` - Aggiorna annuncio (auth)
- `DELETE /api/annunci/:id` - Elimina annuncio (auth)

### Chat
- `GET /api/chat/conversations` - Conversazioni utente
- `POST /api/chat/conversations` - Crea conversazione
- `GET /api/chat/conversations/:id/messages` - Messaggi
- `POST /api/chat/conversations/:id/messages` - Invia messaggio

### Upload
- `POST /api/upload/image` - Upload singola immagine
- `POST /api/upload/images` - Upload multiple immagini

## 🗄️ Database

Il progetto usa **JSON file** per la persistenza (pronto per PostgreSQL):
- `data/users.json` - Utenti
- `data/annunci.json` - Annunci
- `data/conversations.json` - Conversazioni
- `data/messages.json` - Messaggi
- `data/amministrazioni.json` - Amministrazioni

Per migrare a PostgreSQL, modifica `src/utils/db.js`.

## 🌐 Configurazione Dominio

1. Punta il tuo dominio al server (A record)
2. Configura SSL con Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tuodominio.com
   ```
3. Aggiorna `CORS_ORIGIN` nel backend

## 📞 Supporto

Per domande o problemi, contatta: support@casavista.it

---

**Licenza:** MIT - Libero uso per progetti commerciali
