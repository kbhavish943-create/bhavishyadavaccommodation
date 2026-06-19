# Week 1.5 — Availability Locking Foundation (CRITICAL)

**Status:** ✅ COMPLETE  
**Date:** December 23, 2025  
**Purpose:** Add atomic availability locking to prevent double-bookings before payment integration  

---

## 🎯 What Was Added

### 1. **Availability.js Model**
Location: `src/models/Availability.js`

```javascript
{
  hallId: ObjectId,         // Which hall
  date: Date,               // Event date (normalized to UTC 00:00:00)
  status: String,           // "available" | "locked" | "booked"
  bookingId: ObjectId,      // Which booking locked this date
  lockedUntil: Date         // Lock expiry (15 min from lock time)
}
```

**Why separate from Hall?**
- ✅ Enables atomic `findOneAndUpdate` operations
- ✅ Prevents race conditions under concurrent bookings
- ✅ Supports cron cleanup of expired locks
- ✅ Makes payments deterministic (webhook finds locked dates reliably)

**Critical Index:**
```javascript
db.availabilities.createIndex({ hallId: 1, date: 1 }, { unique: true })
```

This ensures:
- Only ONE row per hall per date
- `findOneAndUpdate` cannot create duplicates
- Locking is atomic at database level

---

### 2. **availabilityController.js**
Location: `src/controllers/availabilityController.js`

**Key Functions:**

#### `getAvailability(hallId, fromDate, toDate)`
- Public endpoint
- Returns availability status for date range
- Auto-creates missing dates as "available"

```bash
curl http://localhost:3000/api/availability/halls/{hallId}?fromDate=2024-12-25&toDate=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "count": 7,
  "data": [
    { "hallId": "...", "date": "2024-12-25", "status": "available" },
    { "hallId": "...", "date": "2024-12-26", "status": "locked", "lockedUntil": "..." }
  ]
}
```

#### `setAvailability(hallId, dates, status)`
- Vendor-only endpoint
- Sets dates to "available" or "blocked"
- Used for vendor calendar management

```bash
curl -X POST http://localhost:3000/api/availability/halls/{hallId}/set \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "dates": ["2024-12-25", "2024-12-26"],
    "status": "blocked"
  }'
```

#### `lockDates(hallId, dates, bookingId, session)` ⭐
- **Internal function** (called from bookingController during transaction)
- Atomically locks all dates for a booking
- If ANY date fails → throws error (transaction aborts)
- If ALL dates lock → transaction commits

**Critical for payments:**
```javascript
// In booking creation flow:
await availabilityController.lockDates(
  hallId,
  [eventDate],
  booking._id,
  session  // MongoDB transaction session
);
```

#### `unlockDates(bookingId)`
- Called if payment FAILS
- Releases lock, reverts dates to "available"

#### `markBooked(bookingId)`
- Called by webhook after payment SUCCESS
- Changes status from "locked" → "booked"
- Removes `lockedUntil` (permanent booking)

---

### 3. **bookingController.js**
Location: `src/controllers/bookingController.js`

**Core Function: `createBooking` with MongoDB Transactions**

```
START TRANSACTION
  ↓
Create Booking (status = "pending")
  ↓
Lock Availability Dates (atomic)
  ↓
  ├─ If lock fails → ROLLBACK (booking deleted, dates stay available)
  └─ If lock succeeds → COMMIT (booking + locks persisted)
```

**Code Flow:**
```javascript
const session = await Booking.startSession();
session.startTransaction();

try {
  // 1. Validate & create booking
  const [booking] = await Booking.create([bookingData], { session });
  
  // 2. Lock dates atomically
  await availabilityController.lockDates(
    hallId,
    [eventDate],
    booking._id,
    session  // ← Pass session for transaction
  );
  
  // 3. Commit if all succeed
  await session.commitTransaction();
  res.json({ bookingId, orderId, lockedUntil, nextStep: "Create payment order" });
  
} catch (error) {
  // Rollback if any step fails
  await session.abortTransaction();
  res.status(409).json({ error: "Dates unavailable" });
} finally {
  session.endSession();
}
```

**Atomicity Guarantee:**
- If booking created but dates don't lock → entire booking rolled back
- If dates lock but booking fails → dates not locked (transaction aborts)
- No partial states possible

---

### 4. **Routes**

#### Availability Routes (`src/routes/availabilityRoutes.js`)
```
GET  /api/availability/halls/:hallId?fromDate=...&toDate=...
     → Get availability for date range

POST /api/availability/halls/:hallId/set
     → Vendor sets dates to blocked/available

POST /api/availability/unlock
     → Internal: Unlock dates (payment failed)

POST /api/availability/mark-booked
     → Internal: Mark as booked (payment success)
```

#### Booking Routes (`src/routes/bookingRoutes.js`)
```
POST /api/bookings
     → Create booking (ATOMIC locking happens here)

GET  /api/bookings
     → List customer's bookings

GET  /api/bookings/:bookingId
     → Get booking details

PATCH /api/bookings/:bookingId/status
      → Update booking status (webhook use)
```

---

## 📊 Status Transitions

### Booking Status
```
PENDING → CONFIRMED → COMPLETED
       ↓
     CANCELLED
```

### Availability Status
```
AVAILABLE → LOCKED (15 min TTL) → BOOKED
               ↓ (expired)
            AVAILABLE
               
      or

AVAILABLE → BLOCKED (vendor action)
               ↓
            AVAILABLE (vendor removes block)
```

**Mapping:**
| Booking Status | Availability Status | Meaning |
|---|---|---|
| pending | locked | Waiting for payment (15 min window) |
| confirmed | booked | Payment received, dates reserved |
| cancelled | available | Booking cancelled, dates released |
| completed | booked | Event happened, dates archived |

---

## 🔒 Why This Prevents Double-Booking

### Without Availability Locking ❌
```
User A:
  1. Check dates (show available)
  2. Start payment

User B:
  1. Check dates (show available)
  2. Complete payment → Booking confirmed
  
User A:
  3. Complete payment → Booking confirmed (SAME DATES!)
  
RESULT: Hall double-booked 😞
```

### With Availability Locking ✅
```
User A:
  1. Create booking → LOCK dates + pending (15 min)
  2. Start payment

User B:
  1. Check dates → Shows "locked" (by User A)
  2. Cannot create booking → 409 Conflict
  
User A:
  3. Complete payment → Dates change locked→booked
  
RESULT: Hall single-booked ✅
```

---

## ⏱️ Lock Expiry (15 Minutes)

**Scenario 1: Customer completes payment within 15 min**
```
14:00 - Booking created, dates locked until 14:15
14:10 - Payment received, webhook marks dates booked
RESULT: Success, dates stay booked
```

**Scenario 2: Customer abandons payment**
```
14:00 - Booking created, dates locked until 14:15
14:20 - (15 min passes, lock expired)
14:21 - Cron job finds expired locks, unlocks dates
RESULT: Dates available again for next customer
```

**Without TTL:**
```
14:00 - Booking created, dates locked
14:30 - Customer closed browser (never paid)
14:30 - Dates stuck locked forever (ghost lock)
RESULT: Hall becomes unavailable permanently 😞
```

---

## 🚀 How Week 2 Payments Will Integrate

```
WEEK 1.5 (NOW)              WEEK 2 (NEXT)
─────────────────────────────────────────────

Booking Created ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  (status: pending)                      │
  (dates: locked)                        │ Payment Order Creation
                                         │ POST /api/payments/create-order
Available for 15 min ← ─ ─ ─ ─ ─ ─ ─ ─ ┘
                            ↓
                    User Pays via Razorpay
                            ↓
                    Webhook Notified
                            ↓
                    Update Booking → confirmed
                    Update Availability → booked
                            ↓
                    Booking Confirmed
```

**Payment controller will do:**
1. Fetch booking (must be pending)
2. Verify availability still locked (dates not expired)
3. Create Razorpay order
4. Return orderId to frontend
5. Frontend collects payment
6. Razorpay posts webhook
7. Webhook calls: `POST /api/availability/mark-booked` + update booking status

---

## 🧪 Testing Checklist

- [ ] Create booking → dates get locked
- [ ] Get availability → locked dates show correctly
- [ ] Create second booking for same date → fails with 409
- [ ] Lock expiry cron job (Week 2.5) removes old locks
- [ ] Payment webhook calls `mark-booked` → dates finalized
- [ ] Payment failure calls `unlock` → dates released

---

## 📝 Next Steps (Week 2)

1. **Payment Order Creation** (`POST /api/payments/create-order`)
   - Validate booking pending + lock active
   - Create Razorpay order
   - Store orderId in booking

2. **Razorpay Webhook** (`POST /api/payments/webhook`)
   - Verify signature
   - Check idempotency
   - Call `POST /api/availability/mark-booked`
   - Update booking status → confirmed

3. **Lock Cleanup Cron** (node-cron)
   - Every 5 minutes
   - Find lockedUntil < now
   - Unlock dates + mark booking expired

---

## 📂 Files Added/Modified

**Created:**
- `src/models/Availability.js`
- `src/controllers/availabilityController.js`
- `src/controllers/bookingController.js`
- `src/routes/availabilityRoutes.js`
- `src/routes/bookingRoutes.js`

**Modified:**
- `src/app.js` (mounted availability + booking routes)

**Still Needed for Week 2:**
- `src/controllers/paymentController.js`
- `src/routes/paymentRoutes.js`
- Cron job for lock cleanup

---

## ✅ Verification

Run this to verify setup:

```bash
# 1. Check models loaded
curl http://localhost:3000/health

# 2. Create hall first (via POST /api/halls as vendor)

# 3. Check availability
curl http://localhost:3000/api/availability/halls/{hallId}?fromDate=2024-12-25&toDate=2024-12-31

# 4. Create booking (must be customer role, has JWT token)
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "hallId": "{hallId}",
    "eventDate": "2024-12-25",
    "eventType": "marriage",
    "guestCount": 200,
    "totalAmount": 100000
  }'

# 5. Check availability again (should show "locked")
curl http://localhost:3000/api/availability/halls/{hallId}?fromDate=2024-12-25&toDate=2024-12-31
```

---

**Foundation Complete.** Ready for Week 2 Payments. 🚀
