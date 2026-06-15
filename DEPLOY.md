# 🚀 Guida Completa al Deployment di CasaVista

Questa guida ti accompagna passo passo per mettere online il tuo portale immobiliare.

---

## 📋 Cosa HO GIÀ FATTO IO

✅ Backend Node.js completo con API REST  
✅ Frontend React + TypeScript  
✅ Autenticazione JWT sicura  
✅ Database JSON (pronto per PostgreSQL)  
✅ Upload immagini  
✅ Chat system  
✅ Docker containerizzato  
✅ Nginx configurato  

---

## 🔴 Cosa DEVI FARE TU

### 1. Scegliere dove hostare (3 opzioni)

| Opzione | Difficoltà | Costo | Consigliato per |
|---------|-----------|-------|-----------------|
| **Railway** | ⭐ Facile | ~$5/mese | Iniziare subito |
| **VPS (DigitalOcean/Linode)** | ⭐⭐⭐ Media | ~$6/mese | Controllo totale |
| **AWS/GCP** | ⭐⭐⭐⭐ Difficile | Variabile | Scale enterprise |

---

## 🟢 OPZIONE 1: Railway (Consigliata - 15 minuti)

### Step 1: Preparazione (5 min)

```bash
# 1. Crea un repository GitHub
cd /mnt/okcomputer/output/casavista-prod
git init
git add .
git commit -m "Initial commit"
git branch -M main

# 2. Crea repo su GitHub e push
git remote add origin https://github.com/TUO_USERNAME/casavista.git
git push -u origin main
```

### Step 2: Deploy su Railway (10 min)

1. Vai su [railway.app](https://railway.app)
2. Crea account (puoi usare GitHub)
3. Clicca "New Project" → "Deploy from GitHub repo"
4. Seleziona il tuo repository `casavista`
5. Railway rileverà automaticamente il `Dockerfile`

### Step 3: Variabili d'ambiente

Nella dashboard di Railway, vai su "Variables" e aggiungi:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=genera_una_stringa_lunga_e_casuale_di_64_caratteri
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@tuodominio.it
ADMIN_PASSWORD=password_sicura_lunga_almeno_12_caratteri_con_numeri_e_simboli
```

**Per generare JWT_SECRET sicuro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Dominio (lo fai dopo)

Railway ti dà un URL tipo `casavista-production.up.railway.app`.  
Per collegare il TUO dominio, vedi sezione "Collegare Dominio" più sotto.

---

## 🔵 OPZIONE 2: VPS con Docker (30 minuti)

### Step 1: Acquista VPS

Consigliati:
- **DigitalOcean**: $6/mese - [digitalocean.com](https://digitalocean.com)
- **Linode**: $5/mese - [linode.com](https://linode.com)
- **Hetzner**: €4.51/mese - [hetzner.com](https://hetzner.com) (più economico!)

**Configurazione minima:**
- 1 vCPU
- 1 GB RAM
- 25 GB SSD
- Ubuntu 22.04 LTS

### Step 2: Configura il server

```bash
# Connettiti al server (sostituisci IP con il tuo)
ssh root@TUO_IP_SERVER

# Aggiorna il sistema
apt update && apt upgrade -y

# Installa Docker
curl -fsSL https://get.docker.com | sh

# Installa Docker Compose
apt install docker-compose -y

# Crea directory per il progetto
mkdir -p /opt/casavista
cd /opt/casavista
```

### Step 3: Copia i file

Dal tuo computer locale:

```bash
# Comprimi il progetto
cd /mnt/okcomputer/output
tar -czvf casavista.tar.gz casavista-prod/

# Copia sul server (sostituisci IP)
scp casavista.tar.gz root@TUO_IP_SERVER:/opt/casavista/

# SSH nel server e estrai
ssh root@TUO_IP_SERVER
cd /opt/casavista
tar -xzvf casavista.tar.gz
mv casavista-prod/* .
mv casavista-prod/.* . 2>/dev/null
rm -rf casavista-prod casavista.tar.gz
```

### Step 4: Configura .env

```bash
nano backend/.env
```

Inserisci:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=GENERA_CON_COMANDO_SOPRA
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@tuodominio.it
ADMIN_PASSWORD=PASSWORD_SICURA
```

Salva: `CTRL+O`, `ENTER`, `CTRL+X`

### Step 5: Avvia con Docker

```bash
docker-compose up -d
```

Verifica che funzioni:
```bash
# Controlla i container
docker ps

# Vedi i log
docker-compose logs -f

# Test API
curl http://localhost:5000/api/health
```

### Step 6: Firewall

```bash
# Apri porte necessarie
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

---

## 🌐 COLLEGARE IL TUO DOMINIO

### Step 1: Compra dominio

Dove comprare:
- **Namecheap**: economico, privacy gratuita
- **GoDaddy**: famoso ma più caro
- **Google Domains**: semplice
- **Aruba**: se vuoi supporto italiano

### Step 2: Configura DNS

Nel pannello del tuo registrar, vai nella sezione DNS e crea:

**Record A:**
```
Tipo: A
Nome: @ (oppure lascia vuoto)
Valore: IP_DEL_TUO_SERVER
TTL: 3600
```

**Record A per www:**
```
Tipo: A
Nome: www
Valore: IP_DEL_TUO_SERVER
TTL: 3600
```

**Esempio su Namecheap:**
1. Logga su namecheap.com
2. Vai su "Domain List"
3. Clicca "Manage" accanto al tuo dominio
4. Vai su "Advanced DNS"
5. Aggiungi i record A sopra
6. Salva

**Attendi propagazione DNS:**  
Può richiedere da 5 minuti a 48 ore (solitamente 15-30 min).

Verifica con:
```bash
nslookup tuodominio.it
```

---

## 🔒 CONFIGURARE SSL (HTTPS) - IMPORTANTE!

### Per VPS (Let's Encrypt gratuito)

```bash
# Installa certbot
apt install certbot python3-certbot-nginx -y

# Genera certificato (sostituisci con il tuo dominio)
certbot --nginx -d tuodominio.it -d www.tuodominio.it

# Segui le istruzioni (inserisci email, accetta termini)

# Auto-renewal (già configurato automaticamente)
```

Verifica:
```bash
https://tuodominio.it
```

### Per Railway

Railway fornisce SSL automatico!  
Vai su Settings → Domains → Add Domain

---

## 📧 CONFIGURARE EMAIL (Opzionale ma consigliato)

Per inviare email (verifica account, notifiche):

### Opzione 1: Brevo API

1. Registrati su [brevo.com](https://www.brevo.com)
2. Crea API Key
3. Aggiungi al backend `.env`:
```
BREVO_API_KEY=la_tua_api_key
EMAIL_FROM=CasaVista <noreply@tuodominio.it>
```

### Opzione 2: SendGrid

1. Registrati su [sendgrid.com](https://sendgrid.com)
2. Crea API Key
3. Aggiungi al backend `.env`:
```
SENDGRID_API_KEY=la_tua_api_key
EMAIL_FROM=noreply@tuodominio.it
```

### Opzione 3: Aruba SMTP

```
SMTP_HOST=smtps.aruba.it
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@casavista.it
SMTP_PASS=password_casella_aruba
EMAIL_FROM=CasaVista <noreply@casavista.it>
```

---

## 🗄️ MIGRARE A POSTGRESQL (Consigliato per produzione)

Il database JSON va bene per iniziare, ma per produzione usa PostgreSQL.

### Step 1: Aggiungi PostgreSQL

**Su Railway:**
- Dashboard → New → Database → Add PostgreSQL
- Copia la variabile `DATABASE_URL`

**Su VPS:**
```bash
# Installa PostgreSQL
apt install postgresql postgresql-contrib -y

# Crea database
sudo -u postgres psql -c "CREATE DATABASE casavista;"
sudo -u postgres psql -c "CREATE USER casavista WITH PASSWORD 'password_sicura';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE casavista TO casavista;"
```

### Step 2: Modifica backend

Modifica `backend/src/utils/db.js` per usare PostgreSQL invece di JSON.

Ho già preparato il codice, basta che:
1. Installi `pg`: `npm install pg`
2. Cambi la connessione nel file db.js

---

## 🔧 COMANDI UTILI PER GESTIRE IL SITO

### Vedere log in tempo reale
```bash
docker-compose logs -f
```

### Riavviare tutto
```bash
docker-compose restart
```

### Aggiornare dopo modifiche
```bash
# Pull nuovo codice
git pull

# Ricostruisci e riavvia
docker-compose down
docker-compose up -d --build
```

### Backup database
```bash
# Per JSON
cp -r backend/data backup/$(date +%Y%m%d)_data

# Per PostgreSQL
pg_dump casavista > backup_$(date +%Y%m%d).sql
```

### Monitorare risorse
```bash
docker stats
```

---

## 🚨 CHECKLIST PRE-LAUNCH

- [ ] Dominio acquistato e DNS configurato
- [ ] SSL attivo (HTTPS funziona)
- [ ] JWT_SECRET cambiato (non quello di default)
- [ ] Admin password cambiata
- [ ] Email configurata (Brevo o SendGrid)
- [ ] Database migrato a PostgreSQL (opzionale ma consigliato)
- [ ] Backup automatico configurato
- [ ] Google Analytics aggiunto
- [ ] Privacy Policy e Termini di Servizio

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla i log: `docker-compose logs`
2. Verifica che le porte siano aperte: `netstat -tlnp`
3. Test API: `curl http://localhost:5000/api/health`

---

**Hai finito! 🎉**  
Il tuo portale immobiliare è online!
