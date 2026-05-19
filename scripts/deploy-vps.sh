#!/bin/bash

# CasaVista VPS Deployment Script
# Esegui questo script sul tuo VPS

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./deploy-vps.sh tuodominio.it"
    exit 1
fi

echo "🚀 Deploying CasaVista to $DOMAIN"
echo "================================"

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt install docker-compose -y
fi

# Install Nginx
echo "🌐 Installing Nginx..."
apt install nginx -y

# Install Certbot
echo "🔒 Installing Certbot..."
apt install certbot python3-certbot-nginx -y

# Create app directory
mkdir -p /opt/casavista
cd /opt/casavista

# Clone repository (user should have pushed to GitHub)
echo "📥 Cloning repository..."
# git clone https://github.com/YOUR_USERNAME/casavista.git .

echo ""
echo "⚠️  IMPORTANTE: Copia manualmente i file del progetto in /opt/casavista"
echo "   Puoi usare: scp -r casavista-prod/* root@$DOMAIN:/opt/casavista/"
echo ""
read -p "Premi ENTER quando hai copiato i file..."

# Setup environment
cd /opt/casavista
if [ ! -f backend/.env ]; then
    echo "⚙️  Creating backend .env..."
    cat > backend/.env << EOF
NODE_ENV=production
PORT=5000
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@$DOMAIN
ADMIN_PASSWORD=$(openssl rand -base64 32)
EOF
    echo "✓ backend/.env created"
fi

# Build and start
echo "🏗️  Building and starting containers..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Wait for containers
echo "⏳ Waiting for containers..."
sleep 10

# Test health
echo "🩺 Testing health..."
if curl -s http://localhost:5000/api/health | grep -q "OK"; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Setup Nginx
echo "🌐 Configuring Nginx..."
cp nginx-production.conf /etc/nginx/sites-available/casavista
sed -i "s/tuodominio.it/$DOMAIN/g" /etc/nginx/sites-available/casavista
ln -sf /etc/nginx/sites-available/casavista /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Setup SSL
echo "🔒 Setting up SSL with Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet") | crontab -

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your site is live at:"
echo "   https://$DOMAIN"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email: admin@$DOMAIN"
echo "   Password: (see backend/.env)"
echo ""
echo "📁 Project location: /opt/casavista"
echo ""
echo "Useful commands:"
echo "   docker-compose logs -f    # View logs"
echo "   docker-compose restart    # Restart"
echo "   docker-compose down       # Stop"
echo ""
