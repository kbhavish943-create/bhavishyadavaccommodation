# Testing Ready — Week 1.5 Complete

**Status:** ✅ Ready to test atomic locking locally

---

## 📂 Testing Files Created

| File | Purpose |
|---|---|
| `QUICK_TEST.md` | **START HERE** — 4 steps, 6 minutes |
| `LOCAL_TESTING_SETUP.md` | Detailed testing guide (11 tests) |
| `Test-AtomicLocking.ps1` | Automated PowerShell test script |
| `CHECKPOINT_WEEK_1_5_VERIFIED.md` | Architecture verification |
| `WEEK_1_5_AVAILABILITY_LOCKING.md` | Full technical documentation |
| `TESTING_GUIDE_WEEK_1_5.md` | Manual curl-based tests |

---

## 🚀 How to Run Tests

**Fastest way (6 minutes):**

```powershell
# Terminal 1: Install and start server
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup
npm install
copy .env.example .env
npm run dev

# Terminal 2: Run tests
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup
powershell -ExecutionPolicy Bypass -File Test-AtomicLocking.ps1
```

---

## ✅ What Tests Verify

| Test | What It Does | Critical? |
|---|---|---|
| 1-8 | Setup (server, hall, users) | ❌ |
| **9** | **Book same date → Should FAIL** | **✅ YES** |
| 10 | Book different date → Should SUCCEED | ❌ |
| 11 | Verify both dates locked | ❌ |

**Test 9 is the key:** If it returns 409 → Locking works ✅

---

## 🎯 Expected Results

### Success Scenario (✅ Ready for Week 2)
```
Test 9: Try to book same date
❌ Booking failed: CODE_DATE_NOT_AVAILABLE (409)
✅ Got expected 409 conflict
✅ Atomic locking works!

Final result:
✅ ALL TESTS PASSED
✅ READY FOR WEEK 2 PAYMENTS
```

### Failure Scenario (❌ Debug Before Week 2)
```
Test 9: Try to book same date
✅ Booking created (should have FAILED!)
❌ LOCKING FAILED!

Action: Check MongoDB indexes & transactions
```

---

## 📋 Pre-Test Checklist

Before running tests, verify:

```
☐ Node.js 14+ installed (node --version)
☐ MongoDB running locally OR Atlas connected
☐ .env file created with MONGODB_URI
☐ Port 3000 not in use (or change PORT in .env)
☐ npm install completed successfully
☐ npm run dev starts without errors
```

---

## 📖 Testing Documents

### QUICK_TEST.md (START HERE)
- 4 steps
- 6 minutes to run
- Best for quick verification

### LOCAL_TESTING_SETUP.md (DETAILED)
- 11 manual tests with curl
- Step-by-step instructions
- For troubleshooting if auto script fails

### Test-AtomicLocking.ps1 (AUTOMATED)
- PowerShell script
- Runs all tests automatically
- Shows colored output
- Easiest to use

---

## 🔍 What Happens in Test 9

```
Timeline:

T=0s:   Customer 1 creates booking for Dec 25
        → POST /api/bookings with JWT token
        → Server starts transaction
        → Creates booking (status=pending)
        → Tries to lock date: findOneAndUpdate({
            hallId,
            date: 2024-12-25,
            status: "available"  ← Lock query
          })
        → Date is "available" → LOCKS IT
        → Changes status to "locked"
        → Commits transaction
        → Response: 201 CREATED ✅

T=1s:   Customer 2 tries to book SAME date
        → POST /api/bookings with DIFFERENT JWT token
        → Server starts NEW transaction
        → Creates booking (status=pending)
        → Tries to lock same date: findOneAndUpdate({
            hallId,
            date: 2024-12-25,
            status: "available"  ← Same lock query
          })
        → Date is "locked" (Customer 1 locked it) → NO MATCH
        → findOneAndUpdate finds NO document
        → Throws error: "Could not lock date"
        → Catches error, aborts transaction
        → Rolls back booking creation
        → Response: 409 CONFLICT (date unavailable) ✅✅✅

Key: Both transactions use same query filter
     Unique index prevents duplicate rows
     First transaction succeeds
     Second transaction fails (no matching row)
```

---

## 🎓 Why This Matters

**Without Locking (DANGEROUS):**
```
Both customers book same date → Double-booking → Refund nightmare
```

**With Locking (SAFE):**
```
Customer 1 locks date → Customer 2 blocked → No double-booking → Business safe
```

---

## 📅 Next Steps After Tests Pass

1. ✅ Tests pass → Atomic locking verified
2. 🚀 Start Week 2 → Payment integration
   - POST /api/payments/create-order
   - Razorpay webhook handler
   - Idempotency enforcement
   - Cron cleanup job

---

## 🏁 Ready?

**Open PowerShell and follow QUICK_TEST.md**

Time: ~6 minutes  
Confidence: High  
Next Phase: Week 2 Payments ✅

Let me know results!

---

**Week 1.5 Checkpoint Status: READY FOR TESTING** ✅
