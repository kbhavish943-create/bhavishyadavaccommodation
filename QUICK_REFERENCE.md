# 📋 Quick Reference Cheat Sheet

Fast commands and configurations for development and deployment.

---

## 🚀 Quick Start Commands

### Development Setup (5 minutes)
```powershell
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Install backend dependencies
cd ..\server
npm install

# 3. Setup database
mysql -u root -p < ..\database.sql

# 4. Create environment files
cp .env.example .env
cd ..\frontend
# Create .env.local with Firebase and Stripe keys
```

### Start All Services
```powershell
# Terminal 1: Backend
cd server
npm run dev
# Output: Server running on http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm run dev
# Output: ready - started server on http://localhost:3001

# Terminal 3: Stripe webhooks (optional)
stripe listen --forward-to localhost:3000/api/payment/webhook
```

---

## 🔧 Development Commands

| Task | Command | Location |
|------|---------|----------|
| Install deps | `npm install` | `frontend/` or `server/` |
| Dev server | `npm run dev` | `frontend/` or `server/` |
| Build | `npm run build` | `frontend/` or `server/` |
| Start prod | `npm start` | `frontend/` or `server/` |
| Lint | `npm run lint` | `frontend/` |
| Type check | `npx tsc --noEmit` | `frontend/` |

---

## 📦 Environment Variables Quick Setup

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=myproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=myproject
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=myproject.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=my_website
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CORS_ORIGIN=http://localhost:3001
```

---

## 🌐 API Endpoints Quick Reference

| Endpoint | Method | Purpose | Test |
|----------|--------|---------|------|
| `/health` | GET | Health check | `curl http://localhost:3000/health` |
| `/api/contact` | POST | Submit contact form | See below |
| `/api/payment/create-intent` | POST | Create Stripe payment | See below |
| `/api/payment/webhook` | POST | Stripe webhook handler | (automated) |

### Test Contact Form
```powershell
curl -X POST http://localhost:3000/api/contact `
  -H "Content-Type: application/json" `
  -d '{"name":"John","email":"john@example.com","message":"Test"}'
```

### Test Payment Intent
```powershell
curl -X POST http://localhost:3000/api/payment/create-intent `
  -H "Content-Type: application/json" `
  -d '{"amount":5000}'
```

---

## 🗄️ Database Quick Commands

### Access MySQL
```powershell
mysql -u root -p
USE my_website;
SHOW TABLES;
SELECT * FROM contacts;
```

### Reset Database
```powershell
mysql -u root -p my_website < database.sql
```

### Backup Database
```powershell
mysqldump -u root -p my_website > backup.sql
```

### Restore from Backup
```powershell
mysql -u root -p my_website < backup.sql
```

---

## 🔑 Stripe Test Cards

| Use Case | Card Number | Exp | CVC |
|----------|------------|-----|-----|
| Success | 4242 4242 4242 4242 | Any future | Any |
| Decline | 4000 0000 0000 0002 | Any future | Any |
| 3D Secure | 4000 0025 0000 3155 | Any future | Any |

---

## 🔐 Firebase Quick Setup

### Get Firebase Config
1. Go to Firebase Console
2. Project Settings → Config
3. Copy object properties to `.env.local`

### Enable Authentication Providers
- Email/Password
- Google Sign-in
- (Optional) GitHub, Facebook

### Create Firestore Database
- Go to Firestore Database
- Choose "Start in test mode"
- Select region

---

## 🚢 Deployment Quick Checklist

### Pre-Deployment
- [ ] Update `.env.production` with live keys
- [ ] Run `npm run build` successfully
- [ ] Test all features locally
- [ ] Run `npm run lint`
- [ ] Check TypeScript errors

### Vercel Frontend Deploy
```powershell
npm install -g vercel
cd frontend
vercel --prod
```

### AWS Backend Deploy
```powershell
# SSH to EC2
ssh -i your-key.pem ubuntu@your-ip

# Clone and setup
git clone your-repo
cd my-website/server
npm install
cp .env.example .env
# Update .env with production values
npm start
```

### Configure Domain
- Vercel: Settings → Domains → Add custom domain
- AWS: Use Route 53 or update registrar DNS

---

## 🐛 Common Fixes

### Port Already in Use
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID 12345 /F
```

### Clear npm Cache
```powershell
npm cache clean --force
npm install
```

### Reset Node Modules
```powershell
rm -r node_modules
npm install
```

### Database Connection Error
```powershell
# Check MySQL service
services.msc  # Look for MySQL80 (Windows)

# Test connection
mysql -u root -p -e "SELECT 1"
```

### Stripe Webhook Not Firing
```powershell
# Make sure stripe CLI is running
stripe listen --forward-to localhost:3000/api/payment/webhook

# Check server logs
npm run dev  # Look for webhook messages
```

---

## 📱 Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `pages/index.tsx` | Home page |
| `/contact` | `pages/contact.tsx` | Contact form |
| `/checkout` | `pages/checkout.tsx` | Payment checkout |

---

## 🎨 Color Palette Quick Reference

```css
/* Neon Colors */
--accent-cyan: #00ffff;
--accent-pink: #ff00ff;
--accent-green: #00ff88;
--accent-gold: #ffaa00;
--accent-hot-pink: #ff0080;

/* Backgrounds */
--bg-dark-1: #05070f;
--bg-dark-2: #0f1628;
--bg-dark-3: #1a0f2e;
```

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Frontend Pages | 4 |
| Backend Routes | 3 |
| Database Tables | 7 |
| API Endpoints | 4 |
| Dependencies | 50+ |
| Type Safety | Full (TypeScript) |
| Test Coverage | To be added |

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Next.js Docs | https://nextjs.org/docs |
| Firebase Docs | https://firebase.google.com/docs |
| Stripe Docs | https://stripe.com/docs |
| Tailwind CSS | https://tailwindcss.com |
| Express.js | https://expressjs.com |
| MySQL Docs | https://dev.mysql.com/doc |
| Vercel Deploy | https://vercel.com |
| AWS Console | https://console.aws.amazon.com |

---

## 💾 File Locations Reference

| File | Location |
|------|----------|
| Frontend config | `frontend/next.config.js` |
| Tailwind config | `frontend/tailwind.config.js` |
| Backend config | `server/.env` |
| Database schema | `database.sql` |
| Prisma schema | `prisma/schema.prisma` |
| Setup guide | `SETUP_GUIDE.md` |
| Deploy guide | `DEPLOYMENT_GUIDE.md` |

---

## 🚀 Performance Tips

1. **Frontend**
   - Use `<Image>` component for images
   - Enable automatic code splitting
   - Use dynamic imports for heavy components
   - Monitor bundle size with `npm run build`

2. **Backend**
   - Use connection pooling (already configured)
   - Cache frequently accessed data
   - Use indexes on common queries
   - Monitor response times in production

3. **Database**
   - Add indexes to frequently queried columns
   - Archive old records periodically
   - Backup daily
   - Monitor query performance

---

## 📞 Support Resources

- **Documentation**: `SETUP_GUIDE.md`, `DEPLOYMENT_GUIDE.md`
- **GitHub Issues**: Report bugs and request features
- **Firebase Console**: Debug auth and database issues
- **Stripe Dashboard**: Monitor payments and disputes
- **AWS Console**: Monitor servers and databases

---

## ✅ Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Database imported and verified
- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] Contact form works end-to-end
- [ ] Payment flow tested with test card
- [ ] Firebase authentication tested
- [ ] All pages responsive on mobile
- [ ] No console errors in browser
- [ ] API health check returns 200

---

## 🔄 Update Dependencies

```powershell
# Check for outdated packages
npm outdated

# Update minor/patch versions
npm update

# Update to latest versions (careful!)
npm upgrade  # Windows PowerShell won't work; use:
# npm install package@latest
```

---

## 📝 Git Commands

```powershell
# Clone repo
git clone https://github.com/your-username/my-website.git

# Create feature branch
git checkout -b feature/your-feature

# Stage changes
git add .

# Commit with message
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/your-feature

# Create pull request on GitHub
# (then merge after review)
```

---

## 🎓 Learning Resources

| Topic | Resource |
|-------|----------|
| Next.js | https://nextjs.org/learn |
| React | https://react.dev |
| TypeScript | https://www.typescriptlang.org/docs |
| Tailwind CSS | https://tailwindcss.com/docs |
| Express.js | https://expressjs.com/guide |
| MySQL | https://dev.mysql.com/doc/refman/8.0/en |

---

**Last Updated**: 2024  
**Version**: 1.0.0

Keep this handy for quick reference during development! 📖
