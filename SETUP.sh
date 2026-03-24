#!/bin/bash

# JumpPlusPlus Setup Guide & Quick Start

echo "🚀 JumpPlusPlus Setup Guide"
echo "=================================="
echo ""

# Check Node.js
echo "Checking Node.js..."
node --version
npm --version
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all
echo ""

# .env setup guide
echo "⚙️  Environment Setup Required:"
echo ""
echo "1. Create backend/.env:"
echo "   cp backend/.env.example backend/.env"
echo "   Then edit with your PostgreSQL credentials:"
echo ""
echo "   DATABASE_URL=\"postgresql://user:password@localhost:5432/jumpplusplus?schema=public\""
echo "   JWT_SECRET=\"your-secret-key-minimum-32-chars\""
echo "   PORT=4000"
echo "   NODE_ENV=development"
echo "   FRONTEND_URL=http://localhost:3000"
echo ""
echo "2. Create frontend/.env.local:"
echo "   cp frontend/.env.example frontend/.env.local"
echo ""

# Database setup
echo "3. Setup Database:"
echo "   npm run db:migrate    # Run migrations"
echo "   npm run db:seed       # Seed test data"
echo ""

echo "4. Start Development Servers:"
echo "   npm run dev"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo ""

echo "5. Test Accounts (after seeding):"
echo "   Admin:      admin@jumpplusplus.com / Admin@123456"
echo "   Moderator:  moderator@jumpplusplus.com / User@123456"
echo "   User:       user@jumpplusplus.com / User@123456"
echo ""

echo "=================================="
echo "✨ Ready to build!"
