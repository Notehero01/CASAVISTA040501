#!/bin/bash

# 🚀 Script Deploy Automatico - CasaVista su Railway
# Questo script prepara il progetto per il deploy su Railway

set -e

echo "🏠 CasaVista - Deploy Script"
echo "=============================="

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica prerequisiti
echo ""
echo "📋 Verifica prerequisiti..."

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git non installato${NC}"
    echo "Installa Git: https://git-scm.com/downloads"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non installato${NC}"
    echo "Installa Node.js: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisiti OK${NC}"

# Chiedi informazioni
echo ""
echo "🔧 Configurazione..."
read -p "Inserisci il tuo username GitHub: " GITHUB_USERNAME
read -p "Inserisci il nome del repository (default: casavista): " REPO_NAME
REPO_NAME=${REPO_NAME:-casavista}
read -p "Hai già creato il repository su GitHub? (s/n): " REPO_CREATED

echo ""
echo "🔑 Generazione JWT_SECRET sicuro..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo -e "${GREEN}✅ JWT_SECRET generato${NC}"

echo ""
echo "📁 Preparazione file..."

# Crea .env per produzione
cat > backend/.env << EOF
NODE_ENV=production
PORT=5000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@casavista.it
ADMIN_PASSWORD=CasaVista2024!Admin#Secure
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF

echo -e "${GREEN}✅ File .env creato${NC}"

# Crea .env per frontend
cat > frontend/.env << EOF
VITE_API_URL=/api
EOF

echo -e "${GREEN}✅ File frontend .env creato${NC}"

# Inizializza Git
echo ""
echo "📦 Inizializzazione Git..."

if [ -d ".git" ]; then
    echo "Repository Git esistente"
else
    git init
    git add .
    git commit -m "CasaVista v1.0 - Ready for production"
    git branch -M main
fi

# Configura remote
echo ""
if [ "$REPO_CREATED" = "s" ] || [ "$REPO_CREATED" = "S" ]; then
    echo "🔗 Collegamento a GitHub..."
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    git push -u origin main
    echo -e "${GREEN}✅ Codice pushato su GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Crea il repository su GitHub:${NC}"
    echo "   1. Vai su https://github.com/new"
    echo "   2. Nome repository: $REPO_NAME"
    echo "   3. Clicca 'Create repository'"
    echo ""
    echo "   Poi esegui questi comandi:"
    echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "   git push -u origin main"
fi

# Istruzioni finali
echo ""
echo "=============================="
echo -e "${GREEN}🎉 PREPARAZIONE COMPLETATA!${NC}"
echo "=============================="
echo ""
echo "Prossimi passi:"
echo ""
echo "1️⃣  Vai su https://railway.app"
echo "2️⃣  Crea account con GitHub"
echo "3️⃣  'New Project' → 'Deploy from GitHub repo'"
echo "4️⃣  Seleziona '$REPO_NAME'"
echo "5️⃣  Aggiungi queste variabili in Railway → Variables:"
echo ""
echo "    NODE_ENV=production"
echo "    PORT=5000"
echo "    JWT_SECRET=$JWT_SECRET"
echo "    JWT_EXPIRE=7d"
echo "    ADMIN_EMAIL=admin@casavista.it"
echo "    ADMIN_PASSWORD=CasaVista2024!Admin#Secure"
echo ""
echo "6️⃣  Attendi il deploy (2-3 minuti)"
echo ""
echo "7️⃣  Configura dominio casavista.it:"
echo "    Railway → Settings → Domains → Add Custom Domain"
echo "    Inserisci: casavista.it"
echo ""
echo "8️⃣  Nel tuo registrar (dove hai comprato il dominio):"
echo "    Crea record A: @ → [IP Railway]"
echo "    Crea record A: www → [IP Railway]"
echo ""
echo -e "${GREEN}✅ Il sito sarà online in 5-30 minuti!${NC}"
echo ""
echo "Credenziali Admin:"
echo "  Email: admin@casavista.it"
echo "  Password: CasaVista2024!Admin#Secure"
echo ""
echo "⚠️  IMPORTANTE: Cambia la password admin dopo il primo login!"
echo ""
