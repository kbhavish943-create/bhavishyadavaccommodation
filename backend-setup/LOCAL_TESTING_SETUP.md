# LOCAL TESTING SETUP — Week 1.5 Atomic Locking

Run these steps in order to verify the availability locking works locally.

---

## 📋 PRE-REQUISITES

✅ **Must Have:**
- Node.js 14+ installed
- MongoDB running (local or Atlas)
- npm or yarn

✅ **Check Prerequisites:**

```powershell
# In PowerShell, verify Node.js
node --version
npm --version

# Verify MongoDB is running
# Option 1: Local MongoDB
mongod --version

# Option 2: MongoDB Atlas (cloud)
# Skip if using cloud
```

---

## 🚀 STEP 1: Install Dependencies

```powershell
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup

npm install
```

**Expected output:**
```
added 150 packages in 45s
```

---

## 🔧 STEP 2: Create .env File

```powershell
# Copy .env.example to .env
copy .env.example .env
```

**Edit .env (open in VS Code):**

```powershell
code .env
```

**Update these values:**

```dotenv
PORT=3000
NODE_ENV=development

# MongoDB (use local or Atlas)
MONGODB_URI=mongodb://localhost:27017/event_booking_db
# OR
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event_booking_db

# JWT Secret (change this in production!)
JWT_SECRET=test_secret_key_for_local_testing_only
JWT_EXPIRE=7d
```

**Save and close.**

---

## 🗄️ STEP 3: Verify MongoDB is Running

### Option A: Local MongoDB

```powershell
# Start MongoDB (Windows)
# If installed via msi:
mongod

# If using MongoDB Community:
# Services → MongoDB Server → Start

# Verify connection:
mongosh
# Should show:
# test>
# Type: exit
```

### Option B: MongoDB Atlas (Cloud)

If using MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Copy connection string
3. Update MONGODB_URI in .env with your credentials
4. Test connection in .env file

---

## ▶️ STEP 4: Start the Backend Server

**Open Terminal 1 (New PowerShell):**

```powershell
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup

# Start in development mode (with auto-reload)
npm run dev
```

**Expected output:**
```
✓ MongoDB connected
✓ Server running on port 3000
✓ Environment: development
```

**If error "Port 3000 in use":**
```powershell
# Kill process on port 3000
Get-Process | Where-Object {$_.Port -eq 3000} | Stop-Process -Force

# Or change PORT in .env to 3001
```

**Keep this terminal open.**

---

## 🧪 STEP 5: Run Tests (New Terminal)

**Open Terminal 2 (New PowerShell):**

```powershell
# Navigate to backend-setup
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup
```

### **TEST 1: Health Check**

```powershell
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-12-23T...",
  "environment": "development"
}
```

---

### **TEST 2: Register Vendor**

```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -Headers @{"Content-Type"="application/json"} `
  -Body @{
    name="Vendor Test"
    email="vendor@test.com"
    password="password123"
    role="vendor"
  } | ConvertTo-Json
```

**Expected response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "email": "vendor@test.com",
      "role": "vendor"
    }
  }
}
```

**Save the token → $VENDOR_TOKEN**

---

### **TEST 3: Create Hall**

```powershell
# Save token from Test 2
$VENDOR_TOKEN = "paste_token_from_test_2"
$HALL_ID = ""  # Will update after this test

curl -X POST http://localhost:3000/api/halls `
  -Headers @{
    "Authorization"="Bearer $VENDOR_TOKEN"
    "Content-Type"="application/json"
  } `
  -Body (@{
    hallName="Test Hall"
    description="Test venue for locking"
    category="marriage_hall"
    address="123 Main St"
    city="New York"
    state="NY"
    pincode="10001"
    capacity=500
    basePrice=100000
  } | ConvertTo-Json)
```

**Expected response:**
```json
{
  "success": true,
  "message": "Hall created successfully",
  "data": {
    "_id": "65a7f8d2c1e4f5b2a3c4d5e6",
    "hallName": "Test Hall",
    ...
  }
}
```

**Save the _id → $HALL_ID = "65a7f8d2c1e4f5b2a3c4d5e6"**

---

### **TEST 4: Check Availability (Before Booking)**

```powershell
$HALL_ID = "paste_hall_id_from_test_3"

curl "http://localhost:3000/api/availability/halls/$HALL_ID`?fromDate=2024-12-25&toDate=2024-12-31"
```

**Expected response:**
```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "hallId": "...",
      "date": "2024-12-25T00:00:00.000Z",
      "status": "available"     ← ✅ All available
    },
    ...
  ]
}
```

---

### **TEST 5: Register Customer 1**

```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    name="Customer One"
    email="customer1@test.com"
    password="password123"
    role="customer"
  } | ConvertTo-Json)
```

**Save token → $CUSTOMER1_TOKEN**

---

### **TEST 6: Create Booking (Customer 1) — LOCKS Date**

```powershell
$CUSTOMER1_TOKEN = "paste_token_from_test_5"
$HALL_ID = "paste_hall_id_from_test_3"

curl -X POST http://localhost:3000/api/bookings `
  -Headers @{
    "Authorization"="Bearer $CUSTOMER1_TOKEN"
    "Content-Type"="application/json"
  } `
  -Body (@{
    hallId="$HALL_ID"
    eventDate="2024-12-25"
    eventType="marriage"
    guestCount=200
    totalAmount=100000
  } | ConvertTo-Json)
```

**Expected response:**
```json
{
  "success": true,
  "message": "Booking created. Proceed to payment.",
  "data": {
    "bookingId": "65a8f2d3e4f5b6a7c8d9e0f1",
    "orderId": "BK_1703340300000_ABC123XYZ",
    "hallId": "...",
    "eventDate": "2024-12-25T00:00:00.000Z",
    "totalAmount": 100000,
    "status": "pending",
    "lockedUntil": "2024-12-23T14:30:00.000Z"
  }
}
```

**Save bookingId → $BOOKING1_ID**

---

### **TEST 7: Verify Date is LOCKED (After Test 6)**

```powershell
$HALL_ID = "paste_hall_id"

curl "http://localhost:3000/api/availability/halls/$HALL_ID`?fromDate=2024-12-25&toDate=2024-12-31"
```

**Expected response (CRITICAL):**
```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "hallId": "...",
      "date": "2024-12-25T00:00:00.000Z",
      "status": "locked",        ← ✅ NOW LOCKED (was "available")!
      "bookingId": "65a8f2d3e4f5b6a7c8d9e0f1",
      "lockedUntil": "2024-12-23T14:30:00.000Z"
    },
    {
      "date": "2024-12-26T00:00:00.000Z",
      "status": "available"      ← Still available
    },
    ...
  ]
}
```

**If Dec 25 shows "locked" → ✅ Locking works!**

---

### **TEST 8: Register Customer 2**

```powershell
curl -X POST http://localhost:3000/api/auth/register `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    name="Customer Two"
    email="customer2@test.com"
    password="password123"
    role="customer"
  } | ConvertTo-Json)
```

**Save token → $CUSTOMER2_TOKEN**

---

### **TEST 9: Try to Book SAME Date (Should FAIL) ⭐ CRITICAL TEST**

```powershell
$CUSTOMER2_TOKEN = "paste_token_from_test_8"
$HALL_ID = "paste_hall_id"

curl -X POST http://localhost:3000/api/bookings `
  -Headers @{
    "Authorization"="Bearer $CUSTOMER2_TOKEN"
    "Content-Type"="application/json"
  } `
  -Body (@{
    hallId="$HALL_ID"
    eventDate="2024-12-25"
    eventType="birthday"
    guestCount=150
    totalAmount=100000
  } | ConvertTo-Json)
```

**Expected response (CRITICAL):**
```json
{
  "success": false,
  "error": "Selected date(s) are not available. Please choose different dates.",
  "code": "DATE_NOT_AVAILABLE",
  "detail": "Could not lock date 2024-12-25T00:00:00Z"
}
```

**If you get 409 error → ✅ ATOMIC LOCKING WORKS!**

**If you get 201 (booking succeeds) → ❌ LOCKING FAILED**

---

### **TEST 10: Book DIFFERENT Date (Should SUCCEED)**

```powershell
$CUSTOMER2_TOKEN = "paste_token"
$HALL_ID = "paste_hall_id"

curl -X POST http://localhost:3000/api/bookings `
  -Headers @{
    "Authorization"="Bearer $CUSTOMER2_TOKEN"
    "Content-Type"="application/json"
  } `
  -Body (@{
    hallId="$HALL_ID"
    eventDate="2024-12-26"
    eventType="birthday"
    guestCount=150
    totalAmount=100000
  } | ConvertTo-Json)
```

**Expected response:**
```json
{
  "success": true,
  "message": "Booking created. Proceed to payment.",
  "data": {
    "bookingId": "65a8f2d4e4f5b6a7c8d9e0f2",
    "status": "pending",
    "lockedUntil": "..."
  }
}
```

---

### **TEST 11: Verify Both Dates Locked**

```powershell
$HALL_ID = "paste_hall_id"

curl "http://localhost:3000/api/availability/halls/$HALL_ID`?fromDate=2024-12-25&toDate=2024-12-31"
```

**Expected response:**
```json
{
  "data": [
    { "date": "2024-12-25", "status": "locked", "bookingId": "... booking1 ..." },
    { "date": "2024-12-26", "status": "locked", "bookingId": "... booking2 ..." },
    { "date": "2024-12-27", "status": "available" }
  ]
}
```

---

## ✅ SUCCESS CRITERIA

| Test | Expected | Status |
|---|---|---|
| 1. Health check | 200 OK | ✅ |
| 2. Register vendor | 200 + token | ✅ |
| 3. Create hall | 201 + hallId | ✅ |
| 4. Get availability | All "available" | ✅ |
| 5. Register customer 1 | 200 + token | ✅ |
| 6. Create booking 1 | 201 "pending" | ✅ |
| 7. Check availability | Dec 25 "locked" | ✅ |
| 8. Register customer 2 | 200 + token | ✅ |
| **9. Try same date** | **409 CONFLICT** | **✅ CRITICAL** |
| 10. Book different date | 201 "pending" | ✅ |
| 11. Both dates locked | Both "locked" | ✅ |

---

## 🎯 FINAL VERDICT

- ✅ **All 11 tests pass** → Atomic locking verified, Week 2 ready
- ⚠️ **Test 9 fails (201 instead of 409)** → Debug locking, do NOT proceed to Week 2
- ⚠️ **Any MongoDB error** → Check connection string in .env

---

## 🐛 Troubleshooting

**"Cannot connect to MongoDB"**
```powershell
# Check if MongoDB is running
# Windows: Services → MongoDB Server → check if running
# Or: mongod (start manually)
```

**"Port 3000 already in use"**
```powershell
# Kill process on 3000
Get-Process | Where-Object {$_.Name -eq "node"} | Stop-Process -Force

# Or change PORT=3001 in .env
```

**"Booking succeeds on same date (Test 9 returns 201)"**
```
Check:
1. Is unique index created? (Check MongoDB)
2. Is session passed to lockDates? (Check bookingController.js line 107)
3. Is MongoDB replica set enabled? (Need for transactions)

Run in MongoDB:
db.availabilities.getIndexes()
rs.status()
```

---

## 📝 After Tests Pass

Once all tests (especially Test 9) pass:

1. Keep backend running (`npm run dev`)
2. Report results
3. Ready to proceed with **Week 2: Payment Integration**

---

**Ready to test?** Open PowerShell and start with STEP 1. ✅
