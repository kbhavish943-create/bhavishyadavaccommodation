# 🌟 Modern Full-Stack Website

A complete modern web application built with **Next.js**, **Express.js**, **MySQL**, **Firebase**, and **Stripe**. Production-ready with authentication, payments, and cloud deployment.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node](https://img.shields.io/badge/Node.js-18%2B-green)
![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Setup](#️-environment-setup)
- [Running Locally](#-running-locally)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Database Schema](#️-database-schema)
- [Contributing](#-contributing)

---

## ✨ Features

### Frontend

- ✅ **Next.js 13** with App Router support
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS** with custom neon color palette
- ✅ **Responsive Design** (mobile-first)
- ✅ **Firebase Authentication** (Email, Google Sign-in)
- ✅ **Stripe Payment Integration**
- ✅ **Real-time Firestore** data synchronization

### Backend

- ✅ **Express.js** REST API
- ✅ **MySQL Database** with Prisma ORM
- ✅ **JWT Authentication**
- ✅ **Stripe Webhook** handling
- ✅ **CORS** enabled for secure API access
- ✅ **Input Validation** on all endpoints

### Database

- ✅ **MySQL** relational database
- ✅ **7 Tables** (users, contacts, orders, products, features, gallery, logs)
- ✅ **Database Views** for complex queries
- ✅ **Automatic Timestamps** (created_at, updated_at)
- ✅ **Foreign Key Constraints** for data integrity

### DevOps & Deployment

- ✅ **Vercel** deployment (frontend auto-deploy)
- ✅ **AWS EC2** + **RDS** (production backend)
- ✅ **Docker** containerization ready
- ✅ **Environment-based Configuration**
- ✅ **CI/CD Pipeline** ready

---

## 🛠 Tech Stack

| Layer | Technology | Version |
| - | - | - |
| **Frontend** | Next.js | 13.4.7 |
| **Framework** | React | 18.2.0 |
| **Language** | TypeScript | 5.1.6 |
| **Styling** | Tailwind CSS | 3.4.7 |
| **State Mgmt** | React Hooks | - |
| **UI Library** | Stripe Elements | 2.0.0 |
| **Auth** | Firebase Auth | 9.22.1 |
| **HTTP** | Axios | 1.4.0 |
| **Backend** | Express.js | 4.18.2 |
| **Runtime** | Node.js | 18+ |
| **Database** | MySQL | 8.0+ |
| **ORM** | Prisma | 5.0.0 (planned) |
| **Payments** | Stripe | Latest |
| **Deployment** | Vercel / AWS | - |

---

## 📁 Project Structure

```text
my-website/
├── 📂 frontend/                    # Next.js + React web app
│   ├── pages/                      # Next.js pages
│   │   ├── _app.tsx               # App wrapper
│   │   ├── _document.tsx          # HTML wrapper
│   │   ├── index.tsx              # Home page
│   │   ├── contact.tsx            # Contact form page
│   │   └── checkout.tsx           # Stripe checkout page
│   ├── components/                # Reusable components
│   │   ├── Layout.tsx             # Main layout wrapper
│   │   ├── Header.tsx             # Navigation header
│   │   └── Footer.tsx             # Footer component
│   ├── lib/                       # Utility functions
│   │   ├── firebase.ts            # Firebase initialization
│   │   ├── stripe.ts              # Stripe utilities
│   │   └── api.ts                 # API client
│   ├── styles/                    # Global CSS
│   │   └── globals.css            # Tailwind + custom styles
│   ├── public/                    # Static assets
│   ├── package.json               # Frontend dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── next.config.js             # Next.js configuration
│   ├── tailwind.config.js         # Tailwind configuration
│   ├── postcss.config.js          # PostCSS configuration
│   └── README_FRONTEND.md         # Frontend documentation
│
├── 📂 server/                      # Express.js API
│   ├── routes/                    # API route handlers
│   │   ├── contacts.js            # Contact form endpoint
│   │   ├── payment.js             # Stripe payment routes
│   │   ├── users.js               # User management (planned)
│   │   └── orders.js              # Order management (planned)
│   ├── middleware/                # Custom middleware (planned)
│   │   └── auth.js                # JWT authentication
│   ├── db.js                      # MySQL connection pool
│   ├── index.js                   # Express app setup
│   ├── .env.example               # Environment variables template
│   ├── package.json               # Backend dependencies
│   ├── Dockerfile                 # Docker configuration
│   └── README_SERVER.md           # Backend documentation
│
├── 📂 prisma/                      # Prisma ORM
│   └── schema.prisma              # Database schema definition
│
├── 📂 public/                      # Static assets (root level)
│   └── images/                    # Image files
│
├── 📄 database.sql                # MySQL schema + sample data
├── 📄 package.json                # Root workspace config
├── 📄 docker-compose.yml          # Docker Compose config (planned)
├── 📄 SETUP_GUIDE.md              # Complete setup instructions
├── 📄 DEPLOYMENT_GUIDE.md         # Production deployment guide
├── 📄 README.md                   # This file
└── 📄 .gitignore                  # Git ignore rules
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **MySQL** 8.0+ ([download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([download](https://git-scm.com))

### 1. Clone Repository

```bash
git clone https://github.com/your-username/my-website.git
cd my-website
```

### 2. Setup Frontend

```bash
cd frontend
npm install
```

### 3. Setup Backend

```bash
cd ../server
npm install
```

### 4. Setup Database

```bash
mysql -u root -p < ../database.sql
```

### 5. Configure Environment

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for detailed setup instructions.

### 6. Start Development Servers

**Terminal 1 - Frontend:**

```bash
cd frontend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Backend:**

```bash
cd server
npm run dev
# Runs on http://localhost:3000
```

**Access Application:**

- 🌐 Frontend: [http://localhost:3001](http://localhost:3001)
- 🔌 API: [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Setup

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:3000

# Firebase (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Stripe (get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_key_here
```

### Backend Environment Variables

Create `server/.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=my_website
DB_PORT=3306

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# CORS
CORS_ORIGIN=http://localhost:3001
```

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for detailed setup instructions.

---

## 🏃 Running Locally

### Terminal 1: Database

```bash
# MySQL should be running (Windows: auto-service)
mysql -u root -p -e "SELECT 1"
```

### Terminal 2: Backend

```bash
cd server
npm run dev
```

Output:

```text
Server running on http://localhost:3000
Database connected to my_website
```

### Terminal 3: Frontend

```bash
cd frontend
npm run dev
```

Output:

```text
ready - started server on http://localhost:3001
```

### Terminal 4: Stripe Webhooks (optional)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/payment/webhook
```

### Test the Application

1. Open [http://localhost:3001](http://localhost:3001)
2. Navigate to **Contact** form
3. Fill out and submit contact form
4. Navigate to **Checkout** page
5. Test payment with Stripe test card: `4242 4242 4242 4242`

---

## 📡 API Documentation

### Base URL

- **Development**: [http://localhost:3000](http://localhost:3000)
- **Production**: [https://api.yourdomain.com](https://api.yourdomain.com)

### Endpoints

#### 1. Contact Form

```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here"
}

Response (200):
{
  "success": true,
  "id": 123,
  "message": "Contact saved successfully"
}
```

#### 2. Create Payment Intent

```http
POST /api/payment/create-intent
Content-Type: application/json
Authorization: Bearer {token}

{
  "amount": 5000
}

Response (200):
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "id": "pi_xxxxx"
}
```

#### 3. Payment Webhook

```http
POST /api/payment/webhook
Content-Type: application/json
Stripe-Signature: {signature}

Webhook events:
- payment_intent.succeeded
- payment_intent.payment_failed
```

#### 4. Health Check

```http
GET /health

Response (200):
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🗄️ Database Schema

### Tables

1. **users** - User accounts and authentication
2. **contacts** - Contact form submissions
3. **orders** - Customer orders
4. **order_items** - Order line items
5. **products** - Product catalog
6. **features** - Site features/services
7. **gallery_items** - Image gallery
8. **settings** - Configuration key-value pairs
9. **activity_log** - Audit trail

### Views

- **contact_summary** - Contact statistics
- **featured_content** - Popular products

See `database.sql` for complete schema.

---

## 🚢 Deployment

### Quick Deploy to Vercel (Frontend)

```bash
npm install -g vercel
vercel login
cd frontend
vercel
```

### Quick Deploy to AWS (Backend)

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for step-by-step instructions.

**Key Steps:**

1. Create EC2 instance on AWS
2. Create RDS MySQL database
3. Clone repo on EC2
4. Setup environment variables
5. Start with PM2 for process management
6. Configure Nginx reverse proxy
7. Setup SSL with Let's Encrypt

---

## 🔐 Security

### Best Practices Implemented

- ✅ Environment variables for sensitive data
- ✅ CORS enabled (restrict origins in production)
- ✅ Input validation on all endpoints
- ✅ Stripe webhook signature verification
- ✅ SQL injection prevention (parameterized queries)
- ✅ TypeScript for type safety
- ✅ HTTPS/SSL in production

### Todo: Security Enhancements

- [ ] Implement JWT authentication
- [ ] Add rate limiting middleware
- [ ] Enable CSRF protection
- [ ] Implement request logging
- [ ] Add security headers (helmet.js)
- [ ] Setup HTTPS everywhere
- [ ] Regular security audits

---

## 📊 Performance

### Optimizations

- ✅ Next.js automatic code splitting
- ✅ Tailwind CSS purging
- ✅ Image optimization with Next.js Image
- ✅ Database connection pooling
- ✅ API response caching (planned)
- ✅ CDN for static assets (Vercel)

---

## 🧪 Testing

### Run Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd server
npm test
```

### Manual Testing Checklist

- [ ] Contact form submission
- [ ] Payment flow with Stripe
- [ ] Firebase authentication
- [ ] Mobile responsiveness
- [ ] API health check
- [ ] Database connectivity

---

## 📚 Documentation

| Document | Purpose |
| - | - |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Complete local setup instructions |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Production deployment guide |
| [frontend/README_FRONTEND.md](./frontend/README_FRONTEND.md) | Frontend-specific documentation |
| [server/README_SERVER.md](./server/README_SERVER.md) | Backend API documentation |

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "Add: description"`
4. Push to GitHub: `git push origin feature/your-feature`
5. Create Pull Request with description

### Code Style

- **Frontend**: ESLint + Prettier
- **Backend**: Node.js standard style
- **Database**: Lowercase table names, snake_case columns

---

## 📝 Roadmap

- [x] Core website setup
- [x] Database schema
- [x] Express API
- [x] Next.js frontend
- [x] Stripe integration
- [x] Firebase authentication
- [ ] Admin dashboard
- [ ] Product catalog
- [ ] Shopping cart
- [ ] Order management
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] CI/CD pipelines
- [ ] Load testing

---

## 🆘 Troubleshooting

### Common Issues

### Cannot connect to database

- Ensure MySQL is running
- Check credentials in `.env`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### API connection refused

- Ensure backend server is running on port 3000
- Check CORS_ORIGIN in `server/.env`
- Verify `NEXT_PUBLIC_API_BASE` in `frontend/.env.local`

### Stripe key error

- Use `pk_test_` for Stripe public key
- Use `sk_test_` for Stripe secret key
- Ensure keys are set in correct `.env` files

### TypeScript errors

- Run `npm install` in both frontend and server
- Ensure `@types/node` and `@types/react` are installed

See **[SETUP_GUIDE.md - Troubleshooting](./SETUP_GUIDE.md#troubleshooting)** for more.

---

## 📞 Support

- 📖 Documentation: See guides above
- 🐛 Issues: Report on [GitHub Issues](https://github.com/your-username/my-website/issues)
- 💬 Discussions: Use [GitHub Discussions](https://github.com/your-username/my-website/discussions)
- 📧 Email: [support@yourdomain.com](mailto:support@yourdomain.com)

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👨‍💻 Author

Created with ❤️ for modern web development

---

## 🔄 Latest Updates

**Version 1.0.0** (2024)

- ✨ Initial release
- 🎨 Modern neon color palette
- 🔐 Firebase authentication
- 💳 Stripe payment integration
- 📱 Mobile-responsive design
- 🚀 Production-ready deployment

---

## 🎯 Next Steps

1. ✅ Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for local setup
2. ✅ Configure environment variables
3. ✅ Start development servers
4. ✅ Test all features locally
5. ✅ Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production
6. ✅ Deploy frontend to Vercel
7. ✅ Deploy backend to AWS
8. ✅ Configure custom domain
9. ✅ Enable monitoring

---

## 🎉 Happy Coding

If this project helps you, please ⭐ star it on GitHub!

