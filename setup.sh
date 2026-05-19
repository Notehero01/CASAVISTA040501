#!/bin/bash
set -e

echo "🏠 CasaVista Setup"
echo "=================="
echo ""

# Setup Backend
echo "📦 Setup Backend..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Creato backend/.env"
fi
npm install
cd ..

# Setup Frontend
echo "📦 Setup Frontend..."
cd frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Creato frontend/.env"
fi
npm install
cd ..

# Directory
echo "📁 Creazione directory..."
mkdir -p backend/data backend/uploads

# JWT Secret
echo ""
echo "🔑 JWT_SECRET per .env:"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

echo ""
echo "✅ Setup completato!"
echo ""
echo "Prossimi passi:"
echo "1. Modifica backend/.env con JWT_SECRET sopra"
echo "2. docker-compose up -d"
echo ""
