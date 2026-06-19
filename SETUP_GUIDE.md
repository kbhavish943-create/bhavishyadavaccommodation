# 🚀 Full-Stack Website Setup Guide

Complete guide for setting up and deploying the modern full-stack website with Next.js, Express, MySQL, Firebase, and Stripe.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Firebase Configuration](#firebase-configuration)
6. [Stripe Configuration](#stripe-configuration)
7. [Running Locally](#running-locally)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 16+ (https://nodejs.org)
- **npm** or **yarn** package manager
- **MySQL** 8.0+ (https://dev.mysql.com/downloads/mysql/)
- **Git** (https://git-scm.com)
- **VS Code** or any code editor

### Required Accounts
- **Firebase** account (free tier available) - https://firebase.google.com
- **Stripe** account (test mode free) - https://stripe.com
- **GitHub** account (optional, for version control) - https://github.com

---

## Local Development Setup

### Step 1: Clone/Download Project
```powershell
cd C:\Users\ANITA DEVI\OneDrive\Desktop\my-website
```

### Step 2: Install Dependencies

**Frontend:**
```powershell
cd frontend
npm install
```

**Backend/Server:**
```powershell
cd ..\server
npm install
```

### Step 3: Verify Installation
```powershell
# Check Node version
node --version  # Should be v16+

# Check npm version
npm --version   # Should be v7+
```

---

## Environment Configuration

### Frontend Environment Variables

Create `frontend/.env.local`:
```env
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:3000

# Firebase Configuration (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_HERE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Stripe Configuration (get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
```

### Backend Environment Variables

Create `server/.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=my_website
DB_PORT=3306

# Stripe Configuration (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

---

## Database Setup

### Step 1: Create MySQL Database

```powershell
# Open MySQL command line
mysql -u root -p

# In MySQL prompt:
CREATE DATABASE my_website;
USE my_website;
exit;
```

### Step 2: Import Database Schema

```powershell
# Navigate to project root
cd C:\Users\ANITA DEVI\OneDrive\Desktop\my-website

# Import the SQL schema
mysql -u root -p my_website < database.sql
```

### Step 3: Verify Database

```powershell
mysql -u root -p

# In MySQL prompt:
USE my_website;
SHOW TABLES;
# Should show: activity_log, contacts, featured_items, features, gallery_items, settings, users
SELECT COUNT(*) FROM features;
# Should show: 20 (pre-populated features)
exit;
```

---

## Firebase Configuration

### Step 1: Create Firebase Project

1. Go to https://firebase.google.com
2. Click "Go to console"
3. Click "Create a project"
4. Enter project name (e.g., "my-website")
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider
4. Enable **Google** provider (optional)

### Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your region

### Step 4: Get Configuration Credentials

1. Go to **Project Settings** (gear icon)
2. Copy the configuration object
3. Paste into `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

---

## Stripe Configuration

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click **Sign up**
3. Complete registration

### Step 2: Get API Keys

1. Log in to Stripe Dashboard
2. Go to **Developers** → **API keys**
3. Copy **Publishable key** (starts with `pk_test_`)
4. Copy **Secret key** (starts with `sk_test_`)

### Step 3: Configure Keys

**In `frontend/.env.local`:**
```env
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

**In `server/.env`:**
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
```

### Step 4: Setup Webhook (for local testing)

```powershell
# Install Stripe CLI from https://stripe.com/docs/stripe-cli
# Then run:
stripe login
stripe listen --forward-to localhost:3000/api/payment/webhook
```

Copy the webhook signing secret and add to `server/.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Running Locally

### Terminal 1: Start MySQL (if not running as service)
```powershell
# Windows: MySQL should be running as a service by default
# Verify with:
mysql -u root -p -e "SELECT 1"
```

### Terminal 2: Start Backend Server
```powershell
cd server
npm run dev
# Should output: Server running on http://localhost:3000
```

### Terminal 3: Start Frontend Development Server
```powershell
cd frontend
npm run dev
# Should output: ready - started server on http://localhost:3001
```

### Terminal 4: (Optional) Monitor Stripe Webhooks
```powershell
stripe listen --forward-to localhost:3000/api/payment/webhook
```

### Access Application
- **Frontend**: http://localhost:3001
- **API Health Check**: http://localhost:3000/health
- **Contact API**: POST to http://localhost:3000/api/contact

---

## Deployment

### Vercel (Frontend - Next.js)

1. Push code to GitHub
2. Go to https://vercel.com
3. Click **New Project**
4. Select GitHub repository
5. Add environment variables:
   - All `NEXT_PUBLIC_*` variables from `.env.local`
6. Click **Deploy**

### AWS/GCP (Backend - Express API)

#### Option 1: AWS EC2
```powershell
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance.amazonaws.com

# Clone repo
git clone your-repo-url
cd my-website/server

# Install dependencies
npm install

# Create .env file with production values
# Then start server
npm start
```

#### Option 2: Docker (Recommended)

Create `server/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Create `docker-compose.yml` in project root:
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - "3306:3306"

  api:
    build: ./server
    ports:
      - "3000:3000"
    depends_on:
      - mysql
    environment:
      - DB_HOST=mysql
      - DB_PASSWORD=${DB_PASSWORD}
      - NODE_ENV=production
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
```

### Database Deployment

#### AWS RDS (MySQL)
1. Go to AWS Console → RDS
2. Click **Create database**
3. Select **MySQL 8.0**
4. Configure size and backups
5. Update `DB_HOST` in `.env` to RDS endpoint

#### Google Cloud SQL
1. Go to Google Cloud Console
2. Create Cloud SQL MySQL instance
3. Update connection string in `.env`

---

## Troubleshooting

### "Connection refused" at localhost:3000
**Solution**: Ensure server is running in Terminal 2 and port 3000 is not blocked

### "Cannot find module 'react'"
**Solution**: 
```powershell
cd frontend
npm install
```

### MySQL connection error
**Solution**:
```powershell
# Verify MySQL is running
mysql -u root -p -e "SELECT 1"

# Check credentials in server/.env match your MySQL setup
```

### Stripe webhook not working
**Solution**:
- Ensure `stripe listen` is running in Terminal 4
- Check webhook secret in `server/.env` matches `stripe listen` output
- Verify server is accessible at `http://localhost:3000`

### "Cannot GET /health"
**Solution**: Ensure backend server is started with `npm run dev` in `server/` directory

### Firebase credentials error
**Solution**:
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables are in `frontend/.env.local`
- Double-check values from Firebase Console → Project Settings
- Ensure no extra spaces or quotes

### Port already in use
**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with the number found)
taskkill /PID your_pid /F
```

---

## Quick Reference

| Component | URL | Port | Command |
|-----------|-----|------|---------|
| Frontend | http://localhost:3001 | 3001 | `npm run dev` (in `frontend/`) |
| Backend API | http://localhost:3000 | 3000 | `npm run dev` (in `server/`) |
| MySQL | localhost | 3306 | `mysql -u root -p` |
| Stripe Webhook | http://localhost:3000/api/payment/webhook | 3000 | `stripe listen --forward-to ...` |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/contact` | Submit contact form |
| POST | `/api/payment/create-intent` | Create Stripe PaymentIntent |
| POST | `/api/payment/webhook` | Stripe webhook handler |
| GET | `/health` | API health check |

---

## Project Structure

```
my-website/
├── frontend/                 # Next.js + React + Tailwind
│   ├── pages/               # Next.js pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities (firebase, stripe)
│   ├── styles/              # Global CSS
│   └── package.json
├── server/                  # Express API
│   ├── routes/              # API routes
│   ├── db.js               # MySQL connection
│   ├── index.js            # Express app
│   └── package.json
├── database.sql            # MySQL schema
└── prisma/                 # Prisma ORM schema
    └── schema.prisma
```

---

## Next Steps

After setup:
1. ✅ Test contact form at http://localhost:3001/contact
2. ✅ Test payment at http://localhost:3001/checkout
3. ✅ Check Stripe test payments in Dashboard
4. ✅ Deploy frontend to Vercel
5. ✅ Deploy backend to AWS/GCP
6. ✅ Configure custom domain and SSL
7. ✅ Set up monitoring and backups

---

## Support

For issues or questions:
- Check the Troubleshooting section above
- Review Firebase docs: https://firebase.google.com/docs
- Review Stripe docs: https://stripe.com/docs
- Review Next.js docs: https://nextjs.org/docs

---

**Last Updated**: 2024
**Version**: 1.0.0
