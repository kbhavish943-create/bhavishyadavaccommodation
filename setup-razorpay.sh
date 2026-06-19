#!/bin/bash
# Razorpay Integration Checklist & Setup Script

echo "=============================================="
echo "  💳 RAZORPAY INTEGRATION SETUP"
echo "=============================================="
echo ""

# Check if Node is installed
echo "✓ Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found! Please install from https://nodejs.org"
    exit 1
fi
echo "  Node $(node --version) found"
echo ""

# Backend setup
echo "✓ Setting up Backend..."
if [ ! -d "server" ]; then
    echo "✗ server/ directory not found"
    exit 1
fi

cd server
echo "  Installing backend dependencies..."
npm install

if [ ! -f ".env" ]; then
    echo "  Creating .env file..."
    cp .env.example .env
    echo "  ⚠️  Please update .env with your Razorpay credentials"
fi

cd ..
echo "  Backend ready!"
echo ""

# Frontend setup
echo "✓ Setting up Frontend..."
if [ ! -d "frontend" ]; then
    echo "✗ frontend/ directory not found"
    exit 1
fi

cd frontend
echo "  Installing frontend dependencies..."
npm install

if [ ! -f ".env.local" ]; then
    echo "  Creating .env.local file..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_RAZOR_KEY_ID=rzp_test_your_key_here
EOF
    echo "  ⚠️  Please update .env.local with your Razorpay public key"
fi

cd ..
echo "  Frontend ready!"
echo ""

echo "=============================================="
echo "  ✅ SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Get Razorpay API keys from https://razorpay.com"
echo "2. Update server/.env with:"
echo "   - RAZOR_KEY_ID"
echo "   - RAZOR_KEY_SECRET"
echo "   - RAZOR_WEBHOOK_SECRET"
echo "3. Update frontend/.env.local with:"
echo "   - NEXT_PUBLIC_RAZOR_KEY_ID"
echo "4. Run servers:"
echo "   Terminal 1: cd server && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo "5. Test at http://localhost:3001/payment"
echo ""
echo "📚 For detailed guide, see RAZORPAY_SETUP.md"
echo ""
