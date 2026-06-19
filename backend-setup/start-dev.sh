#!/bin/bash
# start-dev.sh
# Quick start script for development environment

echo "🚀 Starting Event Booking Platform Backend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js 16.x or higher."
  exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "⚠️  .env file not found. Creating from template..."
  cp .env.example .env
  echo "📝 Please update .env with your credentials before running the server."
  echo "   Editor: nano .env"
  exit 0
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed successfully"
  echo ""
fi

# Start the server
echo "🎯 Starting development server..."
echo "📍 Server will run on http://localhost:3000"
echo "💡 Press Ctrl+C to stop the server"
echo ""

npm run dev
