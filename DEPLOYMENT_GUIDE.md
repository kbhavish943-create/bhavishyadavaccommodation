# 🌐 Deployment Guide - Production Ready

Complete guide for deploying the full-stack application to production.

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│   Next.js + React + Tailwind CSS (Auto-deploy from git) │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ↓
        ┌────────────────────────┐
        │   Stripe SDK (Frontend) │
        └────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
    ┌──────────────────┐   ┌──────────────────┐
    │ AWS EC2/ECS      │   │ Firebase Auth    │
    │ (Express API)    │   │ (User Mgmt)      │
    │ Node.js + Express│   │                  │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             └──────────┬───────────┘
                        ↓
            ┌─────────────────────────┐
            │  AWS RDS MySQL Database │
            │  (Production Data)      │
            └─────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ↓                       ↓
    ┌──────────────────┐   ┌──────────────────┐
    │  Backup Snapshots│   │  CloudWatch Logs │
    │  (Daily)         │   │  (Monitoring)    │
    └──────────────────┘   └──────────────────┘
```

---

## Prerequisites

### Accounts Required
- ✅ Vercel account (for Next.js deployment)
- ✅ AWS account (for EC2/RDS)
- ✅ Firebase account (with production project)
- ✅ Stripe account (with production keys)
- ✅ GitHub account (for CI/CD)

### Domain & SSL
- ✅ Custom domain registered
- ✅ SSL certificate (auto via Let's Encrypt or AWS ACM)
- ✅ DNS records configured

---

## Part 1: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Production

1. **Add production environment file:**

`frontend/.env.production`:
```env
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_PRODUCTION_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_your_production_key
```

2. **Update API base URL in code:**

In `frontend/lib/stripe.ts`, ensure API calls use `window.API_BASE` or environment variable

3. **Test build locally:**
```powershell
cd frontend
npm run build
npm run start
```

### Step 2: Deploy to Vercel

1. **Push code to GitHub:**
```powershell
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

2. **Connect GitHub to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure environment variables:**
   - Click "Environment Variables"
   - Add all variables from `.env.production`:
     ```
     NEXT_PUBLIC_API_BASE=https://api.yourdomain.com
     NEXT_PUBLIC_FIREBASE_API_KEY=...
     NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...
     ```
   - For each variable, set it for "Production", "Preview", "Development"

4. **Configure custom domain:**
   - Go to "Settings" → "Domains"
   - Add your custom domain (e.g., `www.yourdomain.com`)
   - Update your DNS provider with Vercel's nameservers

5. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Verify at `https://yourdomain.com`

---

## Part 2: Backend Deployment (AWS EC2)

### Step 1: Create AWS EC2 Instance

1. **Go to AWS Console:**
   - Click "EC2"
   - Click "Launch Instance"

2. **Configure Instance:**
   - **Name**: `my-website-api`
   - **AMI**: Ubuntu Server 22.04 LTS (free tier eligible)
   - **Instance Type**: `t3.micro` (free tier)
   - **Key Pair**: Create new (save `.pem` file securely)
   - **Security Group**: Create with:
     - SSH (port 22): Your IP only
     - HTTP (port 80): 0.0.0.0/0
     - HTTPS (port 443): 0.0.0.0/0

3. **Launch and wait for running state**

### Step 2: Connect to EC2 Instance

```powershell
# Set permissions on key file
icacls "path\to\your-key.pem" /grant:r "$($env:USERNAME):(F)"
icacls "path\to\your-key.pem" /inheritance:r

# Connect via SSH
ssh -i "path\to\your-key.pem" ubuntu@your-instance-ip
```

### Step 3: Setup Node.js on EC2

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 4: Setup Database on AWS RDS

1. **Create RDS MySQL Instance:**
   - Go to AWS RDS Console
   - Click "Create database"
   - **Engine**: MySQL 8.0.32
   - **DB Instance Class**: `db.t3.micro`
   - **Allocated storage**: 20 GB
   - **Master username**: `admin`
   - **Master password**: Strong password (save securely)
   - **VPC**: Same as EC2 instance
   - **Security group**: Allow MySQL (port 3306) from EC2 security group

2. **Get RDS Endpoint:**
   - Wait for "Available" status
   - Copy endpoint (e.g., `my-website-db.xxx.us-east-1.rds.amazonaws.com`)

3. **Connect and import schema:**

From EC2 instance:
```bash
# Install MySQL client
sudo apt install -y mysql-client-core-8.0

# Connect to RDS
mysql -h my-website-db.xxx.us-east-1.rds.amazonaws.com -u admin -p

# In MySQL:
CREATE DATABASE my_website;
exit;

# Import schema (download from your repo)
mysql -h my-website-db.xxx.us-east-1.rds.amazonaws.com -u admin -p my_website < database.sql
```

### Step 5: Deploy API to EC2

```bash
# Clone repository
git clone https://github.com/your-username/my-website.git
cd my-website/server

# Install dependencies
npm install

# Create production .env file
cat > .env << EOF
PORT=3000
NODE_ENV=production
DB_HOST=my-website-db.xxx.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-strong-password
DB_NAME=my_website
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
CORS_ORIGIN=https://yourdomain.com
EOF

# Test the server
npm run dev
```

### Step 6: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/api-yourdomain.com
```

Paste this config:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/api-yourdomain.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d api.yourdomain.com

# Auto-renew certs
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

Update Nginx config to use SSL:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 8: Setup Process Manager (PM2)

```bash
# Start Node.js with PM2
cd ~/my-website/server
pm2 start index.js --name "api"

# Setup auto-restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

---

## Part 3: Stripe Production Setup

### Step 1: Switch to Live Keys

1. Go to Stripe Dashboard
2. Click "Developers" → "API keys"
3. Toggle "Viewing test data" to OFF
4. Copy **Live Publishable Key** (starts with `pk_live_`)
5. Copy **Live Secret Key** (starts with `sk_live_`)

### Step 2: Update Environment Variables

**On Vercel (frontend):**
```
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_your_key
```

**On EC2 (backend):**
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-instance-ip

# Update server .env
sudo nano /home/ubuntu/my-website/server/.env
# Update: STRIPE_SECRET_KEY=sk_live_your_key

# Restart PM2
pm2 restart api
```

### Step 3: Configure Webhook

1. Go to Stripe Dashboard → "Developers" → "Webhooks"
2. Click "Add endpoint"
3. **URL**: `https://api.yourdomain.com/api/payment/webhook`
4. **Events**: Select:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy **Signing Secret** (starts with `whsec_`)
6. Update in EC2 `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_live_secret
   ```

---

## Part 4: Firebase Production Setup

### Step 1: Create Production Firebase Project

1. Go to Firebase Console
2. Create a new project (separate from development)
3. Enable:
   - **Authentication** (Email + Google)
   - **Firestore Database** (production mode with security rules)
   - **Cloud Storage** (for file uploads)

### Step 2: Configure Security Rules

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    // Orders
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid != null;
    }
    // Public data
    match /products/{document=**} {
      allow read: if true;
    }
  }
}
```

### Step 3: Update Environment Variables

**On Vercel:**
```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-production-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-production-api-key
```

---

## Part 5: Monitoring & Logging

### AWS CloudWatch

```bash
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure to log Node.js app
sudo nano /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

### Application Monitoring

Create `server/monitoring.js`:
```javascript
const os = require('os');

function logMetrics() {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    uptime,
    memory: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
    },
    cpu: cpuUsage,
  }));
}

setInterval(logMetrics, 60000); // Log every minute
```

---

## Deployment Checklist

- [ ] Frontend built and tested locally
- [ ] All environment variables set on Vercel
- [ ] Custom domain configured on Vercel
- [ ] SSL certificate obtained for Vercel
- [ ] EC2 instance created and secured
- [ ] Node.js and npm installed on EC2
- [ ] RDS MySQL instance created
- [ ] Database schema imported to RDS
- [ ] API cloned to EC2 and tested
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate obtained for API (Let's Encrypt)
- [ ] PM2 configured to auto-start
- [ ] Stripe webhook configured (live mode)
- [ ] Stripe keys updated (live mode)
- [ ] Firebase security rules configured
- [ ] Monitoring/logging configured
- [ ] Database backups scheduled
- [ ] Load testing completed
- [ ] Security audit completed

---

## DNS Configuration

Update your domain registrar with:

| Type | Name | Value |
|------|------|-------|
| A | @ | Vercel IP (provided by Vercel) |
| CNAME | www | www.yourdomain.com.vercel.app |
| A | api | EC2 Public IP |

---

## Post-Deployment Testing

```bash
# Test frontend
curl https://yourdomain.com

# Test API health
curl https://api.yourdomain.com/health

# Test contact form
curl -X POST https://api.yourdomain.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'

# Test Stripe payment
curl -X POST https://api.yourdomain.com/api/payment/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount":5000}'
```

---

## Scaling Considerations

- **Database**: Enable read replicas on RDS for horizontal scaling
- **API**: Use AWS Auto Scaling Group to scale EC2 instances
- **Frontend**: Already scaled automatically by Vercel
- **CDN**: Configure CloudFront for static assets
- **Caching**: Add Redis for session/cache management

---

## Backup Strategy

1. **Database**: Daily RDS snapshots (30-day retention)
2. **Code**: GitHub repository (version control)
3. **Uploads**: AWS S3 with versioning enabled
4. **Configuration**: Parameter Store for secrets

---

**Last Updated**: 2024  
**Version**: 1.0.0
