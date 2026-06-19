# 🚀 Razorpay Integration - Command Reference

Quick copy-paste commands for setting up and testing Razorpay integration.

---

## 📦 Installation Commands

### Install Backend Dependencies
```powershell
cd server
npm install
```

### Install Frontend Dependencies
```powershell
cd frontend
npm install
```

### Install Both
```powershell
cd server && npm install ; cd ../frontend && npm install
```

---

## ⚙️ Setup Commands

### Copy Environment Templates
```powershell
# Backend
cd server
copy .env.example .env

# Frontend
cd frontend
copy .env.local.example .env.local
```

### Create .env Files Manually

**server/.env:**
```
PORT=3000
CORS_ORIGIN=http://localhost:3001
RAZOR_KEY_ID=rzp_test_your_key_here
RAZOR_KEY_SECRET=your_secret_here
RAZOR_WEBHOOK_SECRET=whsec_your_webhook_here
```

**frontend/.env.local:**
```
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_RAZOR_KEY_ID=rzp_test_your_key_here
```

---

## 🏃 Running Commands

### Start Backend Only
```powershell
cd server
npm run dev
```

### Start Frontend Only
```powershell
cd frontend
npm run dev
```

### Start Both (In Separate Terminals)

**Terminal 1:**
```powershell
cd server
npm run dev
```

**Terminal 2:**
```powershell
cd frontend
npm run dev
```

---

## 🧪 Testing Commands

### Test Backend Health Check
```powershell
curl http://localhost:3000/health
```

### Test Create Order
```powershell
curl -X POST http://localhost:3000/api/razorpay/create-order `
  -H "Content-Type: application/json" `
  -d '{"amount":15000}'
```

### Test Verify Payment
```powershell
curl -X POST http://localhost:3000/api/razorpay/verify-payment `
  -H "Content-Type: application/json" `
  -d '{
    "razorpay_order_id":"order_123",
    "razorpay_payment_id":"pay_456",
    "razorpay_signature":"signature_hash"
  }'
```

---

## 🔧 Build Commands

### Build Frontend for Production
```powershell
cd frontend
npm run build
```

### Build Backend (if applicable)
```powershell
cd server
npm run build
```

### Start Production Frontend
```powershell
cd frontend
npm start
```

---

## 🗑️ Cleanup Commands

### Clear npm Cache
```powershell
npm cache clean --force
```

### Delete node_modules (Backend)
```powershell
cd server
rm -r node_modules
npm install
```

### Delete node_modules (Frontend)
```powershell
cd frontend
rm -r node_modules
npm install
```

### Delete Both
```powershell
cd server && rm -r node_modules && npm install
cd ../frontend && rm -r node_modules && npm install
```

---

## 📝 Environment Variable Commands

### View Backend .env
```powershell
cd server
type .env
```

### Edit Backend .env (in Notepad)
```powershell
cd server
notepad .env
```

### View Frontend .env.local
```powershell
cd frontend
type .env.local
```

### Edit Frontend .env.local (in Notepad)
```powershell
cd frontend
notepad .env.local
```

---

## 🔍 Debugging Commands

### Check Node Version
```powershell
node --version
```

### Check npm Version
```powershell
npm --version
```

### List Installed Packages (Backend)
```powershell
cd server
npm list
```

### Check Port Usage (Port 3000)
```powershell
netstat -ano | findstr :3000
```

### Kill Process on Port 3000
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

---

## 📂 File Navigation Commands

### Navigate to Server
```powershell
cd server
```

### Navigate to Frontend
```powershell
cd frontend
```

### Navigate Back
```powershell
cd ..
```

### List Files
```powershell
ls
```

### List with Details
```powershell
ls -la
```

---

## 🌐 Local URLs

### Frontend
```
http://localhost:3001
```

### Payment Page
```
http://localhost:3001/payment
```

### Backend
```
http://localhost:3000
```

### Health Check
```
http://localhost:3000/health
```

### API Endpoints
```
POST http://localhost:3000/api/razorpay/create-order
POST http://localhost:3000/api/razorpay/verify-payment
POST http://localhost:3000/api/razorpay/webhook
```

---

## 🔑 Getting API Keys

1. **Create Razorpay Account:**
   ```
   https://razorpay.com
   ```

2. **Get API Keys:**
   ```
   https://dashboard.razorpay.com → Settings → API Keys
   ```

3. **Get Webhook Secret:**
   ```
   https://dashboard.razorpay.com → Settings → Webhooks
   ```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `RAZORPAY_SETUP.md` | Complete setup guide (40+ sections) |
| `RAZORPAY_SUMMARY.md` | Quick overview |
| `RAZORPAY_COMPLETE.txt` | Visual summary |
| `RAZORPAY_COMMANDS.md` | This file - all commands |
| `setup-razorpay.bat` | Windows automated setup |
| `setup-razorpay.sh` | Linux/Mac automated setup |

---

## 💳 Test Cards

### Always Works
```
Number: 4111 1111 1111 1111
Expiry: Any future date (MM/YY)
CVV: Any 3 digits
```

### Decline Card
```
Number: 4111 1111 1111 1112
Expiry: Any future date
CVV: Any 3 digits
```

### 3D Secure
```
Number: 4111 1111 1111 1111
CVV: 000
```

---

## 🎯 Full Setup Sequence

### Step 1: Install Dependencies
```powershell
cd server && npm install
cd ../frontend && npm install
```

### Step 2: Create Environment Files
```powershell
# Backend
cd server
copy .env.example .env
notepad .env  # Edit with your credentials

# Frontend
cd frontend
notepad .env.local  # Create and add NEXT_PUBLIC_RAZOR_KEY_ID
```

### Step 3: Start Servers

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Step 4: Test

Open: `http://localhost:3001/payment`

Test with: `4111 1111 1111 1111` (any expiry, any CVV)

---

## 🐛 Troubleshooting Commands

### Check if Port is Available
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Restart Backend
```powershell
# Kill existing process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Start new
cd server && npm run dev
```

### Verify .env Variables
```powershell
cd server
$env:RAZOR_KEY_ID  # Windows PowerShell
echo $RAZOR_KEY_ID  # Linux/Mac
```

### Check npm Registry
```powershell
npm config get registry
```

### Update npm
```powershell
npm install -g npm@latest
```

---

## 📊 Common Workflows

### Setup → Test → Deploy

```powershell
# 1. Setup
cd server && npm install
cd ../frontend && npm install

# 2. Configure
cd server && notepad .env
cd ../frontend && notepad .env.local

# 3. Test Locally
# Terminal 1
cd server && npm run dev

# Terminal 2
cd frontend && npm run dev

# 4. Visit http://localhost:3001/payment

# 5. Test Payment
# Use card: 4111 1111 1111 1111

# 6. Build for Production
cd frontend && npm run build

# 7. Deploy
# (Follow deployment guide)
```

---

## 🔐 Important Security Notes

### Never Commit .env Files
```powershell
# .env should be in .gitignore
# Verify:
cat .gitignore
```

### Never Log Secrets
```javascript
// ❌ WRONG
console.log(process.env.RAZOR_KEY_SECRET);

// ✅ RIGHT
console.log('Secret key loaded');
```

### Only Frontend Key is Public
```
NEXT_PUBLIC_RAZOR_KEY_ID = OK to expose
RAZOR_KEY_SECRET = KEEP SECRET!
```

---

## 📞 Quick Help

| Question | Command |
|----------|---------|
| Check node version | `node --version` |
| Check npm version | `npm --version` |
| Install dependencies | `npm install` |
| Start dev server | `npm run dev` |
| Build production | `npm run build` |
| Clear cache | `npm cache clean --force` |
| View environment | `type .env` |
| Test API | `curl http://localhost:3000/health` |
| Kill process | `taskkill /PID <PID> /F` |
| Check port usage | `netstat -ano \| findstr :3000` |

---

## 🚀 Ready to Go?

```
1. ✅ Razorpay account created
2. ✅ API keys obtained
3. ✅ npm install completed
4. ✅ .env files created
5. ✅ Servers running
6. ✅ Payment page working
7. ✅ Test payment successful

→ You're ready to deploy! 🎉
```

---

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Status:** Complete ✅

Print this file or keep it handy for quick reference!
