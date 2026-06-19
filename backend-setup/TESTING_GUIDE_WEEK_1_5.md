# Quick Testing Guide — Week 1.5 Availability Locking

Run these tests locally to verify atomic locking works before Week 2 payments.

---

## 🧪 Test 1: Create Hall (Foundation)

```bash
# Register as vendor
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vendor Test",
    "email": "vendor@test.com",
    "password": "password123",
    "role": "vendor"
  }'

# Copy token from response

# Login as vendor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@test.com",
    "password": "password123"
  }'

# Copy token, create hall
curl -X POST http://localhost:3000/api/halls \
  -H "Authorization: Bearer {VENDOR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "hallName": "Test Hall",
    "description": "Test venue",
    "category": "marriage_hall",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "capacity": 500,
    "basePrice": 100000
  }'

# Save hallId from response (let's call it HALL_ID)
```

---

## 🧪 Test 2: Check Availability (Before Booking)

```bash
# Get availability for Dec 25-31, 2024
curl "http://localhost:3000/api/availability/halls/{HALL_ID}?fromDate=2024-12-25&toDate=2024-12-31"

# Expected response:
# {
#   "success": true,
#   "count": 7,
#   "data": [
#     {
#       "hallId": "...",
#       "date": "2024-12-25",
#       "status": "available"
#     },
#     ...
#   ]
# }
```

---

## 🧪 Test 3: Create Customer & First Booking (LOCKS Date)

```bash
# Register as customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Test",
    "email": "customer1@test.com",
    "password": "password123",
    "role": "customer"
  }'

# Login as customer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer1@test.com",
    "password": "password123"
  }'

# Copy token, create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer {CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "hallId": "{HALL_ID}",
    "eventDate": "2024-12-25",
    "eventType": "marriage",
    "guestCount": 200,
    "totalAmount": 100000
  }'

# Expected response: 201 CREATED
# {
#   "success": true,
#   "message": "Booking created. Proceed to payment.",
#   "data": {
#     "bookingId": "...",
#     "orderId": "BK_...",
#     "status": "pending",
#     "lockedUntil": "2024-12-23T14:XX:XX.000Z"
#   }
# }

# Save bookingId
```

---

## 🧪 Test 4: Verify Date is LOCKED (After First Booking)

```bash
# Check availability again
curl "http://localhost:3000/api/availability/halls/{HALL_ID}?fromDate=2024-12-25&toDate=2024-12-31"

# Expected response:
# Dec 25 should now be:
# {
#   "date": "2024-12-25",
#   "status": "locked",          ← Changed from "available"!
#   "bookingId": "...",
#   "lockedUntil": "..."
# }
```

---

## 🧪 Test 5: Try to Book SAME Date (Should FAIL) ⭐

```bash
# Register second customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Test 2",
    "email": "customer2@test.com",
    "password": "password123",
    "role": "customer"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer2@test.com", "password": "password123"}'

# Try to book SAME date
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer {CUSTOMER2_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "hallId": "{HALL_ID}",
    "eventDate": "2024-12-25",
    "eventType": "marriage",
    "guestCount": 150,
    "totalAmount": 100000
  }'

# Expected response: 409 CONFLICT
# {
#   "success": false,
#   "error": "Selected date(s) are not available. Please choose different dates.",
#   "code": "DATE_NOT_AVAILABLE"
# }
```

**✅ THIS IS THE CRITICAL TEST — If you get 409, locking works!**

---

## 🧪 Test 6: Book DIFFERENT Date (Should SUCCEED)

```bash
# Try to book Dec 26 (should be available)
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer {CUSTOMER2_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "hallId": "{HALL_ID}",
    "eventDate": "2024-12-26",
    "eventType": "marriage",
    "guestCount": 150,
    "totalAmount": 100000
  }'

# Expected response: 201 CREATED
# ✅ Booking succeeds, Dec 26 is now locked
```

---

## 🧪 Test 7: Verify Both Dates Are Locked

```bash
# Check availability
curl "http://localhost:3000/api/availability/halls/{HALL_ID}?fromDate=2024-12-25&toDate=2024-12-31"

# Expected: Both Dec 25 and Dec 26 should show:
# "status": "locked"
# And they should have DIFFERENT bookingIds
```

---

## ✅ Success Criteria

- [ ] Test 1: Hall created ✅
- [ ] Test 2: Availability returns all "available"
- [ ] Test 3: First booking created, returns 201
- [ ] Test 4: Same date now shows "locked" ✅ CRITICAL
- [ ] Test 5: Second booking same date returns 409 ✅ CRITICAL
- [ ] Test 6: Second booking different date returns 201
- [ ] Test 7: Both dates locked with different bookingIds

**If all 7 pass → Atomic locking is working correctly. Week 2 is safe to start.**

---

## 🐛 If Test 5 Does NOT Return 409

**Problem:** Second booking succeeded even though date was locked.

**Debugging:**
```bash
# Check if unique index exists
# Connect to MongoDB:
mongosh

# In mongosh:
use event_booking_db
db.availabilities.getIndexes()

# Should show:
# {
#   "key": { "hallId": 1, "date": 1 },
#   "unique": true
# }

# If missing, manually create:
db.availabilities.createIndex({ hallId: 1, date: 1 }, { unique: true })
```

**Check transaction support:**
```bash
# MongoDB must support transactions (requires replica set)
# In mongosh:
rs.status()

# If error "not a replica set" → Need to enable:
rs.initiate()
```

**Check booking controller:**
- Verify session is passed to lockDates
- Verify availabilityController.lockDates uses session parameter
- Verify MongoDB transactions are enabled

---

## 📊 What's Happening Under the Hood (Test 5)

```
Customer 1:                        Customer 2:
────────────────────────────────────────────
POST /api/bookings
  ↓ startSession()
  ↓ startTransaction()
  ↓ Create booking
  ↓ lockDates():
    findOneAndUpdate({
      hallId,
      date: 2024-12-25,
      status: "available"  ← Looking for this
    }, {
      status: "locked",
      bookingId,
      lockedUntil
    }, { session })
    
    ✓ FOUND AND LOCKED!
                                   POST /api/bookings
                                     ↓ startSession()
                                     ↓ startTransaction()
                                     ↓ Create booking
                                     ↓ lockDates():
                                       findOneAndUpdate({
                                         hallId,
                                         date: 2024-12-25,
                                         status: "available"  ← Looking for this
                                       }, ...)
                                       
                                       ✗ NOT FOUND!
                                       (already locked by Customer 1)
                                       
                                       → throws error
                                       → abortTransaction()
                                       → Booking rolled back
                                       
                                       ← Response: 409 DATE_NOT_AVAILABLE
    
  ✓ commitTransaction()
  ← Response: 201 CREATED
```

---

## 🎯 Next: Run Tests Locally

Copy these commands into your terminal and execute Test 1-7.

**Report:** If all tests pass, Week 1.5 is verified and Week 2 is ready to start.

**Time to run:** ~5-10 minutes
