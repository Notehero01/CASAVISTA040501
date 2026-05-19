# 🚀 Deploy Completo - casavista.it

Guida passo-passo per mettere online il tuo portale sul dominio acquistato.

---

## 📋 RIEPILOGO

- **Dominio:** casavista.it
- **Stato Database:** ✅ Pulito (solo admin)
- **Credenziali Admin:** admin@casavista.it / CasaVista2024!Admin#Secure

---

## 🎯 OPZIONE CONSIGLIATA: Railway (15 minuti)

### Step 1: Prepara Repository GitHub (5 min)

```bash
# 1. Estrai il pacchetto
cd /mnt/okcomputer/output
tar -xzvf casavista-FINALE.tar.gz
cd casavista-prod

# 2. Inizializza Git
git init
git add .
git commit -m "CasaVista v1.0 - Ready for launch"
git branch -M main

# 3. Crea repository su GitHub
# Vai su github.com → New Repository → "casavista"
# Poi esegui:
git remote add origin https://github.com/TUO_USERNAME/casavista.git
git push -u origin main
```

---

### Step 2: Deploy su Railway (5 min)

1. Vai su [railway.app](https://railway.app)
2. Crea account con GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Seleziona `casavista`
5. Railway rileva automaticamente il `Dockerfile`

**Attendi 2-3 minuti il deploy.**

---

### Step 3: Configura Variabili d'Ambiente (3 min)

Nella dashboard Railway, vai su "Variables" e aggiungi:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=GENERA_CON_QUESTO_COMANDO
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@casavista.it
ADMIN_PASSWORD=CasaVista2024!Admin#Secure
VITE_GOOGLE_MAPS_API_KEY=LA_TUA_API_KEY
```

**Genera JWT_SECRET sicuro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Google Maps API Key:**
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea progetto → Abilita "Maps JavaScript API"
3. Credenziali → Crea API Key

---

### Step 4: Collega Dominio casavista.it (2 min)

#### A. In Railway:
1. Vai su Settings → Domains
2. "Add Custom Domain"
3. Inserisci: `casavista.it`
4. Copia l'**IP** o il **CNAME** che ti fornisce Railway

#### B. Nel tuo Registrar (dove hai comprato casavista.it):

**Configura questi record DNS:**

```
Tipo: A
Nome: @ (oppure lascia vuoto)
Valore: [IP di Railway]
TTL: 3600
```

```
Tipo: A
Nome: www
Valore: [IP di Railway]
TTL: 3600
```

**Esempio configurazione Namecheap:**
1. Login su namecheap.com
2. Domain List → Manage (accanto a casavista.it)
3. Advanced DNS → Add New Record
4. Inserisci i record A sopra
5. Save

---

### Step 5: Attendi Propagazione DNS (5-30 min)

Verifica che funzioni:
```bash
nslookup casavista.it
```

Quando risponde con l'IP di Railway, il sito è online!

---

### Step 6: SSL Automatico ✅

Railway fornisce SSL automatico! 
- Vai su `https://casavista.it`
- Il certificato HTTPS si attiva automaticamente

---

## 🔧 OPZIONE ALTERNATIVA: VPS (30 min)

Se preferisci più controllo:

### Acquista VPS
Consigliati:
- **DigitalOcean**: $6/mese - [digitalocean.com](https://digitalocean.com)
- **Linode**: $5/mese - [linode.com](https://linode.com)
- **Hetzner**: €4.51/mese - [hetzner.com](https://hetzner.com)

Configurazione minima:
- 1 vCPU, 1GB RAM, 25GB SSD
- Ubuntu 22.04 LTS

### Configura Server

```bash
# SSH nel server
ssh root@IP_DEL_SERVER

# Aggiorna
apt update && apt upgrade -y

# Installa Docker
curl -fsSL https://get.docker.com | sh

# Crea directory
mkdir -p /opt/casavista
cd /opt/casavista

# Copia file (dal tuo computer)
scp casavista-FINALE.tar.gz root@IP_DEL_SERVER:/opt/casavista/

# Estrai
ssh root@IP_DEL_SERVER
cd /opt/casavista
tar -xzvf casavista-FINALE.tar.gz
mv casavista-prod/* .
mv casavista-prod/.* . 2>/dev/null
rm -rf casavista-prod

# Configura .env
nano backend/.env
# Inserisci le variabili d'ambiente

# Avvia
docker-compose up -d

# Verifica
docker ps
curl http://localhost:5000/api/health
```

### Configura SSL (Let's Encrypt)

```bash
# Installa certbot
apt install certbot python3-certbot-nginx -y

# Genera certificato
certbot --nginx -d casavista.it -d www.casavista.it

# Segui le istruzioni (inserisci email)
```

---

## 🌐 CONFIGURAZIONE DNS DETTAGLIATA

### Per casavista.it (registrar generico)

| Tipo | Host | Valore | TTL |
|------|------|--------|-----|
| A | @ | [IP Railway/VPS] | 3600 |
| A | www | [IP Railway/VPS] | 3600 |

### Verifica DNS

```bash
# Controlla propagazione
dig casavista.it
nslookup casavista.it

# Test sito
curl -I https://casavista.it
```

---

## ✅ CHECKLIST POST-DEPLOY

- [ ] Sito raggiungibile su https://casavista.it
- [ ] Login admin funziona
- [ ] Pubblicazione annuncio funziona
- [ ] Chat funziona
- [ ] Mappa Google funziona (se API key configurata)
- [ ] SSL attivo (lucchetto verde)
- [ ] Mobile responsive OK

---

## 🚨 RISOLUZIONE PROBLEMI

### Sito non carica
```bash
# Verifica DNS
nslookup casavista.it

# Verifica container
docker ps
docker-compose logs
```

### Errore 502/503
```bash
# Riavvia container
docker-compose restart

# Verifica log
docker-compose logs -f
```

### SSL non funziona
- Attendi 24h per propagazione completa
- Verifica: `curl -v https://casavista.it`

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla log: `docker-compose logs -f`
2. Verifica variabili d'ambiente in Railway
3. Controlla DNS con `dig casavista.it`

---

**🎉 Una volta completato, casavista.it sarà online!**

