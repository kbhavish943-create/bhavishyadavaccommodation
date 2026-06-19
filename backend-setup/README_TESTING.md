# 🎯 WEEK 1.5 MASTER INDEX — Testing & Next Steps

**Current Status:** Week 1.5 Availability Locking Complete ✅  
**Next Phase:** Local Testing → Week 2 Payments  
**Date:** December 23, 2025

---

## 📖 Documentation Map

### 🚀 START HERE (Pick One)

| Document | Time | Purpose |
|---|---|---|
| **[QUICK_TEST.md](./QUICK_TEST.md)** | 6 min | ⭐ Fast testing script |
| **[TESTING_READY.md](./TESTING_READY.md)** | 2 min | Overview & what to expect |
| [LOCAL_TESTING_SETUP.md](./LOCAL_TESTING_SETUP.md) | 30 min | Detailed manual tests |

### 📋 TECHNICAL REFERENCE

| Document | Purpose |
|---|---|
| [CHECKPOINT_WEEK_1_5_VERIFIED.md](./CHECKPOINT_WEEK_1_5_VERIFIED.md) | 5 checkpoints verified |
| [WEEK_1_5_AVAILABILITY_LOCKING.md](./WEEK_1_5_AVAILABILITY_LOCKING.md) | Full technical guide |
| [TESTING_GUIDE_WEEK_1_5.md](./TESTING_GUIDE_WEEK_1_5.md) | 7 curl-based tests |

### 🛠️ AUTOMATED TESTING

| File | Purpose |
|---|---|
| [Test-AtomicLocking.ps1](./Test-AtomicLocking.ps1) | Automated PowerShell tests (easiest) |

---

## ⚡ Quick Path to Testing

### Option A: Fastest (Recommended)

```
1. Read: QUICK_TEST.md (2 min)
2. Run: Test-AtomicLocking.ps1 (4 min)
3. Result: See "ALL TESTS PASSED"
4. Next: Week 2 Payments
```

### Option B: Learning Path

```
1. Read: TESTING_READY.md (overview)
2. Read: WEEK_1_5_AVAILABILITY_LOCKING.md (understand design)
3. Read: CHECKPOINT_WEEK_1_5_VERIFIED.md (verify architecture)
4. Run: Test-AtomicLocking.ps1 (confirm it works)
5. Next: Week 2 Payments
```

### Option C: Detailed Manual Testing

```
1. Read: LOCAL_TESTING_SETUP.md
2. Run: Each curl command manually
3. Understand: Each test in detail
4. Troubleshoot: If needed
5. Next: Week 2 Payments
```

---

## 🎯 What You'll Test

### Critical Test: Test 9

```bash
# First booking (same date) succeeds ✅
curl ... → 201 CREATED

# Second booking (same date) fails ✅
curl ... → 409 CONFLICT (atomic locking works!)
```

**If Test 9 returns 409 → Atomic locking verified → Ready for Week 2**

---

## 📊 What's Ready

### ✅ Week 1.5 Complete

```
✅ Availability.js model (unique index on hallId+date)
✅ availabilityController.js (lockDates, unlockDates, markBooked)
✅ bookingController.js (atomic transaction flow)
✅ availabilityRoutes.js (calendar endpoints)
✅ bookingRoutes.js (booking CRUD)
✅ MongoDB transactions integrated
✅ 15-minute lock TTL
✅ All routes mounted in app.js
```

### ⏳ Week 2 Pending

```
⏳ paymentController.js (create-order, webhook)
⏳ paymentRoutes.js (Razorpay integration)
⏳ Webhook signature verification
⏳ Idempotency enforcement
⏳ Cron cleanup job
```

---

## 🚀 How to Run Tests (3 Commands)

**Terminal 1:**
```powershell
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup
npm install
npm run dev
```

**Terminal 2:**
```powershell
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup
powershell -ExecutionPolicy Bypass -File Test-AtomicLocking.ps1
```

**Expected Output:**
```
✅ ALL TESTS PASSED
✅ ATOMIC LOCKING VERIFIED
✅ READY FOR WEEK 2 PAYMENTS
```

---

## 🔍 Files Changed/Created

### Models
- ✅ **Availability.js** — NEW (critical for locking)

### Controllers
- ✅ **bookingController.js** — NEW (with MongoDB transactions)
- ✅ **availabilityController.js** — NEW (locking logic)

### Routes
- ✅ **bookingRoutes.js** — NEW
- ✅ **availabilityRoutes.js** — NEW

### Config
- ✅ **app.js** — MODIFIED (mounted new routes)

### Documentation
- ✅ WEEK_1_5_AVAILABILITY_LOCKING.md
- ✅ CHECKPOINT_WEEK_1_5_VERIFIED.md
- ✅ TESTING_GUIDE_WEEK_1_5.md
- ✅ LOCAL_TESTING_SETUP.md
- ✅ Test-AtomicLocking.ps1
- ✅ QUICK_TEST.md
- ✅ TESTING_READY.md

---

## 🎓 Key Concepts

### Atomic Locking Flow
```
Booking Created → Dates Locked (15 min TTL)
    ↓
    Payments Collected
    ↓
    Webhook Confirms → Dates Marked Booked (permanent)
    ↓
    OR Payment Fails → Dates Unlocked (available again)
```

### Status Mapping
```
Booking: pending → confirmed → completed
Avail:   locked → booked (or unlocked if payment fails)
```

### Race Condition Prevention
```
Unique index (hallId, date) + MongoDB transactions
  = No double-bookings possible
```

---

## 📞 Troubleshooting Quick Links

| Issue | Solution |
|---|---|
| Server won't start | Check MongoDB running, .env has MONGODB_URI |
| Port 3000 in use | Change PORT=3001 in .env |
| Tests fail | See LOCAL_TESTING_SETUP.md debugging section |
| Test 9 returns 201 | MongoDB transactions not enabled, run `rs.initiate()` |

---

## ✅ Success Criteria

- [ ] npm install succeeds
- [ ] npm run dev shows ✓ MongoDB connected
- [ ] Test 1-8 show ✅
- [ ] Test 9 shows 409 conflict (critical!)
- [ ] Test 10-11 show ✅
- [ ] Final shows "ALL TESTS PASSED"

**If all checks pass → Ready for Week 2** ✅

---

## 🏁 Next: Week 2 Payment Integration

Once tests pass:

**Week 2.1:** POST /api/payments/create-order
- Validate booking (must be pending)
- Verify lock still active
- Create Razorpay order
- Store orderId in booking

**Week 2.2:** POST /api/payments/webhook
- Verify Razorpay signature
- Call POST /api/availability/mark-booked
- Update booking → confirmed

**Week 2.3:** Cron Cleanup Job
- Every 5 minutes
- Find lockedUntil < now
- Unlock dates, expire booking

---

## 📝 Your Next Action

1. **Read:** QUICK_TEST.md (2 minutes)
2. **Run:** Test-AtomicLocking.ps1 (4 minutes)
3. **Report:** "Tests passed" or "Test 9 failed"
4. **Next:** Week 2 Payment Integration

---

**Status: READY FOR TESTING** ✅

Time to confirm atomic locking works: **~6 minutes**

---

## ⚡ Quick Performance Check

After starting backend (`npm run dev`), run:

```powershell
npm run perf
```

Custom target and load:

```powershell
node scripts/benchmark.js http://localhost:3000 50 20
```

Arguments: `baseUrl runs concurrency`
