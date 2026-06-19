# 🚀 QUICK START GUIDE - Event Booking Platform Backend

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
cd backend-setup
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your keys (MongoDB URI, JWT secret, etc.)
```

### 3. Start Server
```bash
npm run dev
# Or: bash start-dev.sh
```

### 4. Test Server
```bash
curl http://localhost:3000/health
```

**✅ Done! Server running on http://localhost:3000**

---

## 📝 API Testing Examples

### 1️⃣ Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "SecurePass123!",
    "userType": "customer"
  }'
```

### 2️⃣ Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response will include:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3️⃣ Create Hall (Vendor)
```bash
curl -X POST http://localhost:3000/api/halls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "hallName": "The Grand Ballroom",
    "description": "Premium wedding venue",
    "category": "marriage_hall",
    "address": "123 Royal Plaza, Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "coordinates": {
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "capacity": {
      "dining": 500,
      "standing": 800
    },
    "basePrice": 100000,
    "amenities": ["AC", "WiFi", "Parking", "Kitchen"],
    "policies": {
      "decorationAllowed": true,
      "outsideFoodAllowed": "partial",
      "outsideDJAllowed": true,
      "liquorPolicy": "allowed"
    }
  }'
```

### 4️⃣ List Halls with Filters
```bash
# Basic list
curl "http://localhost:3000/api/halls"

# With filters
curl "http://localhost:3000/api/halls?city=Mumbai&category=marriage_hall&minPrice=50000&maxPrice=200000&page=1&limit=10&sortBy=rating"

# Geo-spatial search (nearby)
curl "http://localhost:3000/api/halls/search/nearby?latitude=19.0760&longitude=72.8777&maxDistance=50&category=marriage_hall"
```

### 5️⃣ Get Hall Details
```bash
curl "http://localhost:3000/api/halls/{hallId}"
```

---

## 🔑 Key Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/eventbooking

# JWT (Generate random string: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_random_32_char_string_here
JWT_REFRESH_SECRET=another_random_32_char_string

# OTP
OTP_EXPIRY_MINUTES=10

# Payment (Get from Razorpay/Stripe dashboards)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
STRIPE_SECRET_KEY=

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

---

## 🛠️ Common npm Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# View all available scripts
npm run
```

---

## 📊 13 Active API Endpoints

### Authentication (6 endpoints)
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/verify-otp        - Verify OTP
POST   /api/auth/resend-otp        - Resend OTP
POST   /api/auth/refresh-token     - Refresh access token
POST   /api/auth/logout            - Logout user
```

### Halls (7 endpoints)
```
POST   /api/halls                  - Create hall (vendor)
GET    /api/halls                  - List halls with filters
GET    /api/halls/:hallId          - Get hall details
GET    /api/halls/search/nearby    - Geo-spatial search
PUT    /api/halls/:hallId          - Update hall (vendor)
DELETE /api/halls/:hallId          - Delete hall (vendor)
GET    /api/vendors/me/halls       - Get vendor's halls
```

---

## 📂 Key Files Reference

| Task | File | What to Do |
|------|------|-----------|
| Add new endpoint | `src/routes/newRoutes.js` + `src/controllers/newController.js` | Create files |
| Add new model | `src/models/NewModel.js` | Create schema |
| Add validation | `src/utils/validators.js` | Add Joi schema |
| Change database | `src/config/database.js` | Update connection |
| Change logging | `src/config/logger.js` | Update config |
| Environment vars | `.env` | Update values |
| Start server | `src/index.js` | Entry point |
| Express setup | `src/app.js` | Middleware, routes |
| Auth logic | `src/controllers/authController.js` | Business logic |

---

## 🔍 Troubleshooting

### Problem: "MongoDB Connection Failed"
**Solution:** 
```bash
# Start MongoDB
mongod  # macOS/Linux
# or Open MongoDB Compass and ensure server is running
```

### Problem: "Port 3000 already in use"
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows (then taskkill)
```

### Problem: "JWT secret not found"
**Solution:**
```bash
# Ensure .env file exists and has JWT_SECRET
cp .env.example .env
nano .env  # Add JWT_SECRET value
```

### Problem: "Module not found"
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## ✅ Checklist Before Going to Production

- [ ] Updated all environment variables in `.env`
- [ ] MongoDB connection verified
- [ ] JWT secrets are strong (32+ chars)
- [ ] CORS is configured for frontend URL
- [ ] Rate limiting is enabled
- [ ] Error logging is working
- [ ] All API endpoints tested with Postman
- [ ] Security headers (Helmet) are enabled
- [ ] Input validation is working
- [ ] Database backups configured
- [ ] HTTPS certificate configured
- [ ] CI/CD pipeline setup

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Frontend (Next.js, React)                   │
│         Port: 3001                                  │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS/TLS
                     ↓
┌─────────────────────────────────────────────────────┐
│     API Gateway / Load Balancer (Optional)          │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│    Express.js Backend (Node.js)                     │
│    Port: 3000                                       │
│    ┌─────────────────────────────────────────────┐  │
│    │ Authentication │ Validation │ Rate Limit    │  │
│    ├─────────────────────────────────────────────┤  │
│    │ Auth Router  │ Hall Router │ [More Routes] │  │
│    ├─────────────────────────────────────────────┤  │
│    │ Auth Controller │ Hall Controller │ [More]  │  │
│    ├─────────────────────────────────────────────┤  │
│    │ User │ Vendor │ Hall │ Booking │ Payment... │  │
│    └─────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
    MongoDB      Redis        File Storage
    Database    Caching      (Cloudinary)
```

---

## 🎓 Learning Resources

- **Express.js**: https://expressjs.com
- **MongoDB**: https://docs.mongodb.com
- **Mongoose**: https://mongoosejs.com
- **JWT**: https://jwt.io
- **Joi Validation**: https://joi.dev
- **Razorpay API**: https://razorpay.com/docs
- **Stripe API**: https://stripe.com/docs

---

## 💡 Pro Tips

1. **Use Postman** for API testing - Import collection from examples
2. **Check logs** in `src/logs/error.log` for debugging
3. **Use optional auth** for public endpoints that benefit from user context
4. **Implement pagination** for large datasets (default: limit=10)
5. **Use geo-spatial queries** for location-based features
6. **Cache frequently accessed** data with Redis
7. **Monitor rate limiting** to prevent abuse
8. **Use soft deletes** instead of hard deletes for audit trail

---

## 📞 Need Help?

- Check `BACKEND_README.md` for detailed documentation
- See `WEEK1_2_SUMMARY.md` for progress tracking
- Review `PROJECT_STRUCTURE.md` for file organization
- Check `src/logs/` for error messages
- Use `curl` or Postman for API debugging

---

**🎉 Happy Coding! You're ready to build amazing features!**
