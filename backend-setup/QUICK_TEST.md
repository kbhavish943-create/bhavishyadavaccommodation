# 🚀 QUICK START — Run Tests Now

**This is the fastest way to verify atomic locking works.**

---

## 📋 PREREQUISITES (Check These First)

```powershell
# Check Node.js installed
node --version   # Should be 14+

# Check MongoDB running
# Option 1: Local
mongod --version

# Option 2: MongoDB Atlas (cloud)
# Just need connection string
```

---

## ⚡ 4 QUICK STEPS

### STEP 1: Setup (1 minute)

```powershell
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup

# Copy env file
copy .env.example .env

# Install dependencies
npm install
```

### STEP 2: Update .env (1 minute)

```powershell
# Open .env in editor
code .env

# Make sure these are set:
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/event_booking_db
# JWT_SECRET=test_secret_key

# Save and close
```

### STEP 3: Start Server (Keep running)

```powershell
# Open NEW PowerShell window and run:
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup
npm run dev

# Wait for:
# ✓ MongoDB connected
# ✓ Server running on port 3000
```

### STEP 4: Run Tests (2-3 minutes)

```powershell
# Open ANOTHER NEW PowerShell window and run:
cd c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\backend-setup

# Run the automated test script
powershell -ExecutionPolicy Bypass -File Test-AtomicLocking.ps1
```

---

## 📊 What to Expect

**Test 1-8:** Should show ✅

**Test 9 (CRITICAL):** 
- ✅ Should show: `✅ Got expected 409 conflict`
- ❌ If it shows: `✅ Booking created` → Locking failed

**Test 10-11:** Should show ✅

**Final:** 
```
╔════════════════════════════════════════════╗
║  ✅ ALL TESTS PASSED                        ║
║  ATOMIC LOCKING VERIFIED                   ║
║  READY FOR WEEK 2 PAYMENTS                 ║
╚════════════════════════════════════════════╝
```

---

## 🎯 If Tests Pass

You're ready for Week 2 Payment Integration! 🚀

Keep the server running and report:

```
✅ All tests passed
✅ Test 9 returned 409 (atomic locking works)
✅ Ready for Week 2
```

---

## ❌ If Test 9 Returns 201 (NOT 409)

**Problem:** Atomic locking not working

**Possible causes:**
1. MongoDB transactions not enabled (need replica set)
2. Unique index not created
3. Session not passed to lockDates

**Debug:**

```powershell
# Check MongoDB
mongosh
use event_booking_db

# See if unique index exists:
db.availabilities.getIndexes()

# If not, create manually:
db.availabilities.createIndex({ hallId: 1, date: 1 }, { unique: true })

# Check replica set:
rs.status()

# If no replica set, enable:
rs.initiate()
```

---

## 📞 Need Help?

Check:
1. **Server running?** → See STEP 3, wait for ✓ messages
2. **MongoDB connected?** → Check connection string in .env
3. **Port in use?** → Change PORT=3001 in .env
4. **Test failed?** → Check LOCAL_TESTING_SETUP.md for detailed tests

---

## ✅ Timeline

- Installation: ~2 min
- Server startup: ~1 min
- Run tests: ~3 min
- **Total: ~6 minutes**

**Go!** 🚀
