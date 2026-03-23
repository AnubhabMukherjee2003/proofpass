#!/bin/bash

echo "🎟️  ProofPass Setup Script"
echo "=========================="
echo ""

# Check prerequisites
echo "✓ Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "  ✓ Node.js found: $(node -v)"

if ! command -v forge &> /dev/null; then
    echo "✗ Foundry not found. Please install Foundry"
    exit 1
fi
echo "  ✓ Foundry found: $(forge --version)"

if ! command -v redis-cli &> /dev/null; then
    echo "⚠ Redis not found. Install Redis and start it: redis-server"
    echo ""
fi

# Setup backend
echo ""
echo "Setting up backend..."
cd backend

if [ ! -f .env ]; then
    echo "  Creating .env from .env.example..."
    cp .env.example .env
    echo "  ✓ .env created - IMPORTANT: Update with actual credentials"
fi

echo "  Installing dependencies..."
npm install --silent

echo "  ✓ Backend setup complete"

# Instructions
echo ""
echo "=========================="
echo "✅ Setup Complete!"
echo "=========================="
echo ""
echo "📋 Next steps:"
echo ""
echo "1️⃣  Start Anvil (Terminal 1):"
echo "   $ anvil"
echo ""
echo "2️⃣  Start Backend (Terminal 2):"
echo "   $ cd backend && node app.js"
echo ""
echo "3️⃣  Test APIs with Postman:"
echo "   - Import: backend/ProofPass.postman_collection.json"
echo "   - Set variables: {{base_url}}, {{phone}}, {{admin_phone}}"
echo ""
echo "4️⃣  Or use cURL:"
echo "   $ curl http://localhost:3000/health"
echo ""
echo "📚 Full documentation: README.md"
echo "🏗️  Architecture: proofpass.md"
echo ""
