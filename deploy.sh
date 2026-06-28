#!/bin/bash

# Divine Naturals - VPS Automated Deployment Script
# Usage: curl -sSL https://raw.githubusercontent.com/.../deploy.sh | bash

echo "🚀 Starting Divine Naturals Deployment..."

# 1. Update and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git postgresql postgresql-contrib nginx

# 2. Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi

# 3. Setup PostgreSQL
echo "🗄️ Configuring Database..."
sudo -u postgres psql -c "CREATE DATABASE divine_naturals;" || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER divine_admin WITH PASSWORD 'Divine@2025';" || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE divine_naturals TO divine_admin;"

# 4. Update repository (if in a git repo)
if [ -d ".git" ]; then
    echo "📂 Updating existing repository..."
    git pull
else
    echo "📂 Cloning repository..."
    git clone https://github.com/Saty-27/DeployDivenenaturals.git .
fi

# 5. Install Project Dependencies
echo "📥 Installing dependencies..."
npm install

# 6. Setup Environment Variables
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file..."
    cat <<EOT >> .env
DATABASE_URL=postgresql://divine_admin:Divine@2025@localhost:5432/divine_naturals
PORT=5000
NODE_ENV=production
ADMIN_USERNAME=GauranitaiMDSummitShah
ADMIN_PASSWORD=Gauranitai@2026
EOT
fi

# 7. Build and Migration
echo "🛠️ Building application..."
npm run build
npm run db:push

# 8. Setup Process Manager (PM2)
echo "🔋 Starting application with PM2..."
sudo npm install -g pm2
APP_NAME=$(basename $(pwd))
pm2 stop "$APP_NAME" || true
pm2 start dist/index.js --name "$APP_NAME"
pm2 save
pm2 startup

echo "✅ Deployment Successful!"
echo "📍 App is running on port 5000 (Internal)"
echo "🚀 Next Steps: Configure Nginx and SSL using the project documentation guide."
