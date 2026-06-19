# Event Booking Platform - Database Migration Script

## 📊 Migration Overview

This script migrates data from the legacy hotel booking system to the new multi-service event booking platform.

### Data Transformation Map

```
OLD SYSTEM (Hotels) → NEW SYSTEM (Event Booking)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hotel_managers  → vendors (hall owners)
rooms           → halls (event venues)
bookings        → bookings (event bookings)
users           → users (event customers/guests)
payments        → payments (transaction log)
reviews         → reviews (ratings & feedback)
```

---

## 🗄️ MongoDB Migration Script

### 1️⃣ USERS MIGRATION

```javascript
// migrate-users.js
// Migrate user data with new userType field

const mongoose = require('mongoose');

async function migrateUsers() {
  try {
    console.log('Starting user migration...');
    
    // Connect to databases
    const oldDb = mongoose.createConnection(process.env.OLD_DB_URI);
    const newDb = mongoose.createConnection(process.env.NEW_DB_URI);
    
    // Old User Model
    const OldUser = oldDb.model('User', {
      userId: String,
      name: String,
      email: String,
      phone: String,
      password: String,
      createdAt: Date,
      updatedAt: Date
    });
    
    // New User Schema
    const NewUser = newDb.model('User', {
      userId: { type: String, unique: true, required: true },
      name: { type: String, required: true },
      email: { type: String, unique: true, required: true },
      phone: { type: String, unique: true, required: true },
      password: { type: String, required: true },
      userType: { 
        type: String, 
        enum: ['customer', 'vendor', 'admin'],
        default: 'customer'
      },
      profileImage: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
      },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    // Fetch all old users
    const oldUsers = await OldUser.find({});
    console.log(`Found ${oldUsers.length} users to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const oldUser of oldUsers) {
      try {
        const newUser = new NewUser({
          userId: oldUser.userId || generateId(),
          name: oldUser.name,
          email: oldUser.email,
          phone: oldUser.phone,
          password: oldUser.password,
          userType: 'customer', // Default: all old users are customers
          isActive: true,
          createdAt: oldUser.createdAt || new Date(),
          updatedAt: oldUser.updatedAt || new Date()
        });
        
        await newUser.save();
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`✓ Migrated ${migratedCount} users...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating user ${oldUser.userId}:`, error.message);
      }
    }
    
    console.log(`\n✓ User migration completed!`);
    console.log(`✓ Successfully migrated: ${migratedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    
    await oldDb.close();
    await newDb.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function generateId() {
  return `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

migrateUsers();
```

---

### 2️⃣ VENDORS MIGRATION (from hotel_managers)

```javascript
// migrate-vendors.js
// Migrate hotel managers to vendors with KYC info

async function migrateVendors() {
  try {
    console.log('Starting vendor migration...');
    
    const oldDb = mongoose.createConnection(process.env.OLD_DB_URI);
    const newDb = mongoose.createConnection(process.env.NEW_DB_URI);
    
    // Old Hotel Manager Model
    const OldHotelManager = oldDb.model('HotelManager', {
      managerId: String,
      name: String,
      email: String,
      phone: String,
      hotelName: String,
      city: String,
      password: String,
      createdAt: Date
    });
    
    // New Vendor Model
    const NewVendor = newDb.model('Vendor', {
      vendorId: { type: String, unique: true, required: true },
      userId: { type: String, required: true }, // Link to user
      name: { type: String, required: true },
      email: { type: String, unique: true, required: true },
      phone: { type: String, unique: true, required: true },
      businessName: { type: String, required: true },
      city: { type: String, required: true },
      
      // KYC Information
      kycStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      aadhar: {
        number: String,
        documentUrl: String,
        verified: { type: Boolean, default: false }
      },
      pan: {
        number: String,
        documentUrl: String,
        verified: { type: Boolean, default: false }
      },
      
      // Bank Details for Payouts
      bankAccount: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        accountType: { type: String, enum: ['savings', 'current'] }
      },
      
      // Commission & Payouts
      commissionPercentage: { type: Number, default: 10 }, // 10% platform fee
      totalEarnings: { type: Number, default: 0 },
      totalPayouts: { type: Number, default: 0 },
      
      // Profile
      profileImage: String,
      about: String,
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      
      // Status
      isActive: { type: Boolean, default: true },
      isSuspended: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const oldVendors = await OldHotelManager.find({});
    console.log(`Found ${oldVendors.length} vendors to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const oldVendor of oldVendors) {
      try {
        // Create associated user account
        const NewUser = newDb.model('User');
        const vendorUser = new NewUser({
          userId: `VENDOR_${oldVendor.managerId}`,
          name: oldVendor.name,
          email: oldVendor.email,
          phone: oldVendor.phone,
          password: oldVendor.password,
          userType: 'vendor',
          isActive: true
        });
        await vendorUser.save();
        
        // Create vendor profile
        const newVendor = new NewVendor({
          vendorId: `VENDOR_${oldVendor.managerId}`,
          userId: vendorUser._id.toString(),
          name: oldVendor.name,
          email: oldVendor.email,
          phone: oldVendor.phone,
          businessName: oldVendor.hotelName,
          city: oldVendor.city,
          kycStatus: 'pending', // Require re-verification
          isActive: true,
          createdAt: oldVendor.createdAt || new Date()
        });
        
        await newVendor.save();
        migratedCount++;
        
        if (migratedCount % 50 === 0) {
          console.log(`✓ Migrated ${migratedCount} vendors...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating vendor ${oldVendor.managerId}:`, error.message);
      }
    }
    
    console.log(`\n✓ Vendor migration completed!`);
    console.log(`✓ Successfully migrated: ${migratedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    
    await oldDb.close();
    await newDb.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

const mongoose = require('mongoose');
migrateVendors();
```

---

### 3️⃣ HALLS MIGRATION (from rooms)

```javascript
// migrate-halls.js
// Migrate hotel rooms to event halls/venues

async function migrateHalls() {
  try {
    console.log('Starting halls migration...');
    
    const oldDb = mongoose.createConnection(process.env.OLD_DB_URI);
    const newDb = mongoose.createConnection(process.env.NEW_DB_URI);
    
    // Old Room Model
    const OldRoom = oldDb.model('Room', {
      roomId: String,
      hotelId: String,
      managerId: String,
      roomNumber: String,
      capacity: Number,
      price: Number,
      amenities: [String],
      images: [String],
      description: String,
      isAvailable: Boolean,
      createdAt: Date,
      updatedAt: Date
    });
    
    // New Hall Model
    const NewHall = newDb.model('Hall', {
      hallId: { type: String, unique: true, required: true },
      vendorId: { type: String, required: true },
      name: { type: String, required: true },
      description: String,
      
      // Venue Details
      capacity: {
        minGuests: Number,
        maxGuests: { type: Number, required: true },
        byType: {
          marriage: Number,
          birthday: Number,
          corporate: Number,
          engagement: Number,
          other: Number
        }
      },
      
      // Location
      location: {
        address: String,
        city: { type: String, required: true },
        state: String,
        zipCode: String,
        coordinates: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: [Number] // [longitude, latitude]
        }
      },
      
      // Pricing
      pricing: {
        basePrice: { type: Number, required: true },
        weekdayMultiplier: { type: Number, default: 1.0 },
        weekendMultiplier: { type: Number, default: 1.2 },
        festivalMultiplier: { type: Number, default: 1.5 },
        pricePerPerson: Number,
        cancellationPolicy: String
      },
      
      // Amenities
      amenities: [String],
      
      // Media
      images: [String],
      videos: [String],
      
      // Menus (if catering available)
      menus: [{ type: String, ref: 'Menu' }],
      
      // Ratings & Reviews
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      
      // Status & Availability
      status: {
        type: String,
        enum: ['pending', 'active', 'inactive', 'suspended'],
        default: 'pending'
      },
      isAvailable: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const oldRooms = await OldRoom.find({});
    console.log(`Found ${oldRooms.length} rooms to migrate as halls`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const oldRoom of oldRooms) {
      try {
        // Map old room to new hall
        const newHall = new NewHall({
          hallId: `HALL_${oldRoom.roomId}`,
          vendorId: `VENDOR_${oldRoom.managerId}`,
          name: `${oldRoom.roomNumber} - Event Space`,
          description: oldRoom.description || 'Premium event hall',
          
          capacity: {
            maxGuests: oldRoom.capacity,
            byType: {
              marriage: oldRoom.capacity,
              birthday: Math.floor(oldRoom.capacity * 0.8),
              corporate: Math.floor(oldRoom.capacity * 0.9),
              engagement: Math.floor(oldRoom.capacity * 0.7),
              other: oldRoom.capacity
            }
          },
          
          location: {
            address: `Room ${oldRoom.roomNumber}`,
            city: 'To be updated', // Will need manual entry
            coordinates: {
              type: 'Point',
              coordinates: [72.8479, 19.0760] // Default Mumbai coordinates
            }
          },
          
          pricing: {
            basePrice: oldRoom.price,
            weekdayMultiplier: 1.0,
            weekendMultiplier: 1.2,
            festivalMultiplier: 1.5
          },
          
          amenities: oldRoom.amenities || [],
          images: oldRoom.images || [],
          status: oldRoom.isAvailable ? 'active' : 'inactive',
          isAvailable: oldRoom.isAvailable,
          createdAt: oldRoom.createdAt || new Date()
        });
        
        await newHall.save();
        migratedCount++;
        
        if (migratedCount % 50 === 0) {
          console.log(`✓ Migrated ${migratedCount} halls...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating room ${oldRoom.roomId}:`, error.message);
      }
    }
    
    console.log(`\n✓ Hall migration completed!`);
    console.log(`✓ Successfully migrated: ${migratedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    
    // Create geospatial index for location-based queries
    console.log('\nCreating geospatial index...');
    await NewHall.collection.createIndex({ 'location.coordinates': '2dsphere' });
    console.log('✓ Geospatial index created');
    
    await oldDb.close();
    await newDb.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

const mongoose = require('mongoose');
migrateHalls();
```

---

### 4️⃣ BOOKINGS MIGRATION

```javascript
// migrate-bookings.js
// Migrate hotel bookings to event bookings

async function migrateBookings() {
  try {
    console.log('Starting bookings migration...');
    
    const oldDb = mongoose.createConnection(process.env.OLD_DB_URI);
    const newDb = mongoose.createConnection(process.env.NEW_DB_URI);
    
    // Old Booking Model
    const OldBooking = oldDb.model('Booking', {
      bookingId: String,
      userId: String,
      roomId: String,
      checkInDate: Date,
      checkOutDate: Date,
      guests: Number,
      totalPrice: Number,
      status: String,
      createdAt: Date,
      updatedAt: Date
    });
    
    // New Booking Model
    const NewBooking = newDb.model('Booking', {
      bookingId: { type: String, unique: true, required: true },
      customerId: { type: String, required: true },
      hallId: { type: String, required: true },
      vendorId: { type: String, required: true },
      
      // Event Details
      eventType: { 
        type: String, 
        enum: ['marriage', 'birthday', 'corporate', 'engagement', 'other'],
        default: 'other'
      },
      eventDate: { type: Date, required: true },
      eventTime: String,
      guestCount: { type: Number, required: true },
      eventDuration: String, // e.g., "4 hours", "Full day"
      
      // Pricing
      pricing: {
        hallPrice: Number,
        catering: { type: Number, default: 0 },
        decoration: { type: Number, default: 0 },
        services: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        tax: Number,
        totalAmount: { type: Number, required: true }
      },
      
      // Payment Status
      paymentStatus: {
        type: String,
        enum: ['pending', 'advance_received', 'paid', 'refunded', 'disputed'],
        default: 'pending'
      },
      
      // Booking Status
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
      },
      
      // Cancellation
      cancellationReason: String,
      refundAmount: Number,
      
      // Notes
      customerNotes: String,
      vendorNotes: String,
      
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const oldBookings = await OldBooking.find({});
    console.log(`Found ${oldBookings.length} bookings to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const oldBooking of oldBookings) {
      try {
        // Calculate event duration
        const checkOut = new Date(oldBooking.checkOutDate);
        const checkIn = new Date(oldBooking.checkInDate);
        const durationHours = (checkOut - checkIn) / (1000 * 60 * 60);
        const eventDuration = durationHours > 24 ? 'Full day' : `${durationHours} hours`;
        
        const newBooking = new NewBooking({
          bookingId: `BK_${oldBooking.bookingId}`,
          customerId: `USER_${oldBooking.userId}`,
          hallId: `HALL_${oldBooking.roomId}`,
          vendorId: 'TBD', // Will need lookup
          
          eventType: 'other', // Default
          eventDate: oldBooking.checkInDate,
          guestCount: oldBooking.guests,
          eventDuration: eventDuration,
          
          pricing: {
            hallPrice: oldBooking.totalPrice,
            totalAmount: oldBooking.totalPrice
          },
          
          paymentStatus: 'paid',
          status: mapOldStatusToNew(oldBooking.status),
          createdAt: oldBooking.createdAt || new Date()
        });
        
        await newBooking.save();
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`✓ Migrated ${migratedCount} bookings...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating booking ${oldBooking.bookingId}:`, error.message);
      }
    }
    
    console.log(`\n✓ Booking migration completed!`);
    console.log(`✓ Successfully migrated: ${migratedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    
    await oldDb.close();
    await newDb.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

function mapOldStatusToNew(oldStatus) {
  const statusMap = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'cancelled': 'cancelled',
    'completed': 'completed',
    'checked_in': 'confirmed',
    'checked_out': 'completed'
  };
  return statusMap[oldStatus] || 'pending';
}

const mongoose = require('mongoose');
migrateBookings();
```

---

### 5️⃣ PAYMENTS MIGRATION

```javascript
// migrate-payments.js
// Migrate payment records

async function migratePayments() {
  try {
    console.log('Starting payments migration...');
    
    const oldDb = mongoose.createConnection(process.env.OLD_DB_URI);
    const newDb = mongoose.createConnection(process.env.NEW_DB_URI);
    
    // Old Payment Model
    const OldPayment = oldDb.model('Payment', {
      paymentId: String,
      bookingId: String,
      amount: Number,
      method: String,
      status: String,
      transactionId: String,
      createdAt: Date
    });
    
    // New Payment Model
    const NewPayment = newDb.model('Payment', {
      paymentId: { type: String, unique: true, required: true },
      bookingId: { type: String, required: true },
      customerId: { type: String, required: true },
      vendorId: { type: String, required: true },
      
      amount: { type: Number, required: true },
      gateway: { 
        type: String, 
        enum: ['razorpay', 'stripe', 'upi', 'bank_transfer'],
        default: 'razorpay'
      },
      
      gatewayTransactionId: String,
      status: {
        type: String,
        enum: ['initiated', 'processing', 'success', 'failed', 'refunded'],
        default: 'success'
      },
      
      refundStatus: {
        type: String,
        enum: ['none', 'partial', 'full'],
        default: 'none'
      },
      refundAmount: { type: Number, default: 0 },
      
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const oldPayments = await OldPayment.find({});
    console.log(`Found ${oldPayments.length} payments to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const oldPayment of oldPayments) {
      try {
        const newPayment = new NewPayment({
          paymentId: `PAY_${oldPayment.paymentId}`,
          bookingId: `BK_${oldPayment.bookingId}`,
          customerId: 'TBD', // Lookup from booking
          vendorId: 'TBD', // Lookup from booking
          
          amount: oldPayment.amount,
          gateway: 'razorpay', // Default
          gatewayTransactionId: oldPayment.transactionId,
          status: oldPayment.status === 'success' ? 'success' : 'failed',
          createdAt: oldPayment.createdAt || new Date()
        });
        
        await newPayment.save();
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`✓ Migrated ${migratedCount} payments...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating payment ${oldPayment.paymentId}:`, error.message);
      }
    }
    
    console.log(`\n✓ Payment migration completed!`);
    console.log(`✓ Successfully migrated: ${migratedCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    
    await oldDb.close();
    await newDb.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

const mongoose = require('mongoose');
migratePayments();
```

---

### 6️⃣ MASTER MIGRATION RUNNER

```javascript
// migrate-all.js
// Master script to run all migrations in sequence

const { spawn } = require('child_process');
require('dotenv').config();

async function runMigration(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Starting: ${scriptName}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const process = spawn('node', [scriptName], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✓ ${scriptName} completed successfully\n`);
        resolve();
      } else {
        console.error(`\n✗ ${scriptName} failed with code ${code}\n`);
        reject(new Error(`${scriptName} failed`));
      }
    });
  });
}

async function runAllMigrations() {
  try {
    console.log('\n🚀 Starting Event Booking Platform Migration\n');
    console.log('Migration Sequence:');
    console.log('1. Users');
    console.log('2. Vendors');
    console.log('3. Halls');
    console.log('4. Bookings');
    console.log('5. Payments');
    console.log('6. Verification\n');
    
    // Run migrations in sequence (dependencies matter)
    await runMigration('migrate-users.js');
    await runMigration('migrate-vendors.js');
    await runMigration('migrate-halls.js');
    await runMigration('migrate-bookings.js');
    await runMigration('migrate-payments.js');
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60) + '\n');
    
    // Run verification
    console.log('\nRunning post-migration verification...');
    await runMigration('verify-migration.js');
    
    console.log('\n✓ Migration process finished!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
}

runAllMigrations();
```

---

### 7️⃣ MIGRATION VERIFICATION SCRIPT

```javascript
// verify-migration.js
// Verify data integrity after migration

const mongoose = require('mongoose');
require('dotenv').config();

async function verifyMigration() {
  try {
    const db = mongoose.createConnection(process.env.NEW_DB_URI);
    
    console.log('\n📊 MIGRATION VERIFICATION REPORT\n');
    
    // Define models
    const User = db.model('User');
    const Vendor = db.model('Vendor');
    const Hall = db.model('Hall');
    const Booking = db.model('Booking');
    const Payment = db.model('Payment');
    
    // Count records
    const userCount = await User.countDocuments();
    const vendorCount = await Vendor.countDocuments();
    const hallCount = await Hall.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const paymentCount = await Payment.countDocuments();
    
    console.log('📝 Data Counts:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Vendors: ${vendorCount}`);
    console.log(`   Halls: ${hallCount}`);
    console.log(`   Bookings: ${bookingCount}`);
    console.log(`   Payments: ${paymentCount}`);
    
    // Check for missing required fields
    console.log('\n🔍 Data Quality Checks:\n');
    
    // Users without email
    const usersNoEmail = await User.countDocuments({ email: { $exists: false } });
    console.log(`   ⚠️  Users without email: ${usersNoEmail}`);
    
    // Vendors without KYC
    const vendorsNoPan = await Vendor.countDocuments({ 'pan.number': { $exists: false } });
    console.log(`   ⚠️  Vendors without PAN: ${vendorsNoPan}`);
    
    // Halls without city
    const hallsNoCity = await Hall.countDocuments({ 'location.city': { $exists: false } });
    console.log(`   ⚠️  Halls without city: ${hallsNoCity}`);
    
    // Bookings with pending status
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    console.log(`   ℹ️  Pending bookings: ${pendingBookings}`);
    
    // Payments with failed status
    const failedPayments = await Payment.countDocuments({ status: 'failed' });
    console.log(`   ℹ️  Failed payments: ${failedPayments}`);
    
    // Sample records
    console.log('\n📋 Sample Records:\n');
    
    const sampleUser = await User.findOne({});
    console.log('Sample User:');
    console.log(JSON.stringify(sampleUser, null, 2));
    
    const sampleVendor = await Vendor.findOne({});
    console.log('\nSample Vendor:');
    console.log(JSON.stringify(sampleVendor, null, 2));
    
    const sampleHall = await Hall.findOne({});
    console.log('\nSample Hall:');
    console.log(JSON.stringify(sampleHall, null, 2));
    
    // Index check
    console.log('\n🔑 Indexes Created:\n');
    const indexes = await Hall.collection.getIndexes();
    Object.keys(indexes).forEach(index => {
      console.log(`   ✓ ${index}`);
    });
    
    console.log('\n✓ Verification complete!\n');
    
    await db.close();
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyMigration();
```

---

## 📋 SQL MIGRATION (Alternative for MySQL)

### Migration SQL Script

```sql
-- migrate-hotel-to-event.sql
-- Migrate existing hotel system to event booking platform

-- 1. Create new users table with userType
ALTER TABLE users ADD COLUMN IF NOT EXISTS userType ENUM('customer', 'vendor', 'admin') DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profileImage VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zipCode VARCHAR(20);

-- 2. Create vendors table from hotel_managers
CREATE TABLE IF NOT EXISTS vendors (
  vendorId VARCHAR(50) PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  businessName VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  
  -- KYC
  kycStatus ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  aadharNumber VARCHAR(20),
  aadharDocUrl VARCHAR(255),
  panNumber VARCHAR(20),
  panDocUrl VARCHAR(255),
  
  -- Bank Details
  bankAccountName VARCHAR(255),
  bankAccountNumber VARCHAR(50),
  bankIfsc VARCHAR(20),
  bankName VARCHAR(255),
  bankAccountType ENUM('savings', 'current'),
  
  -- Commission & Earnings
  commissionPercentage DECIMAL(5,2) DEFAULT 10.00,
  totalEarnings DECIMAL(15,2) DEFAULT 0,
  totalPayouts DECIMAL(15,2) DEFAULT 0,
  
  -- Status
  isActive BOOLEAN DEFAULT TRUE,
  isSuspended BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  totalReviews INT DEFAULT 0,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_city (city),
  INDEX idx_email (email)
);

-- Migrate data: Copy hotel managers to vendors
INSERT INTO vendors (
  vendorId, userId, name, email, phone, businessName, city, kycStatus, createdAt
)
SELECT 
  CONCAT('VENDOR_', managerId),
  u.id,
  hm.name,
  hm.email,
  hm.phone,
  hm.hotelName,
  hm.city,
  'pending',
  hm.createdAt
FROM hotel_managers hm
JOIN users u ON hm.email = u.email
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE vendorId = CONCAT('VENDOR_', hm.managerId));

-- 3. Create halls table from rooms
CREATE TABLE IF NOT EXISTS halls (
  hallId VARCHAR(50) PRIMARY KEY,
  vendorId VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Capacity
  minGuests INT DEFAULT 10,
  maxGuests INT NOT NULL,
  capacity_marriage INT,
  capacity_birthday INT,
  capacity_corporate INT,
  capacity_engagement INT,
  
  -- Location
  address VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  zipCode VARCHAR(20),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Pricing
  basePrice DECIMAL(15,2) NOT NULL,
  weekdayMultiplier DECIMAL(3,2) DEFAULT 1.0,
  weekendMultiplier DECIMAL(3,2) DEFAULT 1.2,
  festivalMultiplier DECIMAL(3,2) DEFAULT 1.5,
  pricePerPerson DECIMAL(10,2),
  cancellationPolicy TEXT,
  
  -- Amenities (JSON)
  amenities JSON,
  
  -- Media
  images JSON,
  videos JSON,
  
  -- Status
  status ENUM('pending', 'active', 'inactive', 'suspended') DEFAULT 'pending',
  isAvailable BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 0,
  totalReviews INT DEFAULT 0,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendorId) REFERENCES vendors(vendorId),
  INDEX idx_city (city),
  INDEX idx_vendorId (vendorId),
  SPATIAL INDEX idx_location (POINT(longitude, latitude))
);

-- Migrate data: Copy rooms to halls
INSERT INTO halls (
  hallId, vendorId, name, description, maxGuests, address, city,
  basePrice, capacity_marriage, capacity_birthday, amenities, images,
  status, isAvailable, createdAt
)
SELECT 
  CONCAT('HALL_', r.roomId),
  CONCAT('VENDOR_', hm.managerId),
  CONCAT(r.roomNumber, ' - Event Space'),
  r.description,
  r.capacity,
  CONCAT('Room ', r.roomNumber),
  hm.city,
  r.price,
  r.capacity,
  FLOOR(r.capacity * 0.8),
  JSON_ARRAY_INSERT('[]', '$', r.amenities),
  JSON_ARRAY_INSERT('[]', '$', r.image),
  CASE WHEN r.isAvailable = 1 THEN 'active' ELSE 'inactive' END,
  r.isAvailable,
  r.createdAt
FROM rooms r
JOIN hotel_managers hm ON r.hotelId = hm.hotelId
WHERE NOT EXISTS (SELECT 1 FROM halls WHERE hallId = CONCAT('HALL_', r.roomId));

-- 4. Create bookings table (event-focused)
CREATE TABLE IF NOT EXISTS bookings (
  bookingId VARCHAR(50) PRIMARY KEY,
  customerId INT NOT NULL,
  hallId VARCHAR(50) NOT NULL,
  vendorId VARCHAR(50) NOT NULL,
  
  -- Event Details
  eventType ENUM('marriage', 'birthday', 'corporate', 'engagement', 'other') DEFAULT 'other',
  eventDate DATE NOT NULL,
  eventTime TIME,
  guestCount INT NOT NULL,
  eventDuration VARCHAR(50),
  
  -- Pricing Breakdown
  hallPrice DECIMAL(15,2),
  cateringPrice DECIMAL(15,2) DEFAULT 0,
  decorationPrice DECIMAL(15,2) DEFAULT 0,
  servicePrice DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  taxAmount DECIMAL(15,2),
  totalAmount DECIMAL(15,2) NOT NULL,
  
  -- Status
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  paymentStatus ENUM('pending', 'advance_received', 'paid', 'refunded', 'disputed') DEFAULT 'pending',
  
  -- Cancellation
  cancellationReason VARCHAR(255),
  refundAmount DECIMAL(15,2),
  
  -- Notes
  customerNotes TEXT,
  vendorNotes TEXT,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customerId) REFERENCES users(id),
  FOREIGN KEY (hallId) REFERENCES halls(hallId),
  FOREIGN KEY (vendorId) REFERENCES vendors(vendorId),
  INDEX idx_customerId (customerId),
  INDEX idx_hallId (hallId),
  INDEX idx_eventDate (eventDate),
  INDEX idx_status (status)
);

-- Migrate bookings (old bookings → new bookings format)
INSERT INTO bookings (
  bookingId, customerId, hallId, vendorId, eventDate, guestCount,
  hallPrice, totalAmount, status, paymentStatus, createdAt
)
SELECT
  CONCAT('BK_', b.bookingId),
  b.userId,
  CONCAT('HALL_', b.roomId),
  CONCAT('VENDOR_', hm.managerId),
  b.checkInDate,
  b.guests,
  b.totalPrice,
  b.totalPrice,
  CASE WHEN b.status = 'confirmed' THEN 'confirmed'
       WHEN b.status = 'cancelled' THEN 'cancelled'
       ELSE 'pending' END,
  'paid',
  b.createdAt
FROM bookings b
JOIN rooms r ON b.roomId = r.roomId
JOIN hotel_managers hm ON r.hotelId = hm.hotelId
WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE bookingId = CONCAT('BK_', b.bookingId));

-- 5. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  paymentId VARCHAR(50) PRIMARY KEY,
  bookingId VARCHAR(50) NOT NULL,
  customerId INT NOT NULL,
  vendorId VARCHAR(50) NOT NULL,
  
  amount DECIMAL(15,2) NOT NULL,
  gateway ENUM('razorpay', 'stripe', 'upi', 'bank_transfer') DEFAULT 'razorpay',
  gatewayTransactionId VARCHAR(255),
  status ENUM('initiated', 'processing', 'success', 'failed', 'refunded') DEFAULT 'success',
  
  refundStatus ENUM('none', 'partial', 'full') DEFAULT 'none',
  refundAmount DECIMAL(15,2) DEFAULT 0,
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bookingId) REFERENCES bookings(bookingId),
  FOREIGN KEY (customerId) REFERENCES users(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(vendorId),
  INDEX idx_bookingId (bookingId),
  INDEX idx_status (status)
);

-- Migrate payments
INSERT INTO payments (
  paymentId, bookingId, customerId, vendorId, amount, 
  gatewayTransactionId, status, createdAt
)
SELECT
  CONCAT('PAY_', p.paymentId),
  CONCAT('BK_', p.bookingId),
  b.userId,
  CONCAT('VENDOR_', hm.managerId),
  p.amount,
  p.transactionId,
  CASE WHEN p.status = 'success' THEN 'success' ELSE 'failed' END,
  p.createdAt
FROM payments p
JOIN bookings b ON p.bookingId = b.bookingId
JOIN rooms r ON b.roomId = r.roomId
JOIN hotel_managers hm ON r.hotelId = hm.hotelId
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE paymentId = CONCAT('PAY_', p.paymentId));

-- 6. Create indexes for optimization
CREATE INDEX idx_bookings_eventDate ON bookings(eventDate);
CREATE INDEX idx_bookings_vendorId ON bookings(vendorId);
CREATE INDEX idx_halls_city ON halls(city);
CREATE INDEX idx_payments_createdAt ON payments(createdAt);

-- 7. Verification Queries
SELECT 'Migration Summary' as Report;
SELECT CONCAT('Total Users: ', COUNT(*)) FROM users;
SELECT CONCAT('Total Vendors: ', COUNT(*)) FROM vendors;
SELECT CONCAT('Total Halls: ', COUNT(*)) FROM halls;
SELECT CONCAT('Total Bookings: ', COUNT(*)) FROM bookings;
SELECT CONCAT('Total Payments: ', COUNT(*)) FROM payments;
```

---

## ⚙️ Running the Migration

### Setup

```bash
# Install dependencies
npm install mongodb mongoose dotenv

# Create .env file
echo "OLD_DB_URI=mongodb://old-host:27017/hotel_db" > .env
echo "NEW_DB_URI=mongodb://new-host:27017/event_booking_db" >> .env
```

### Execute

```bash
# Run MongoDB migration
node migrate-all.js

# Or run SQL migration (MySQL)
mysql -u root -p < migrate-hotel-to-event.sql

# Verify migration
node verify-migration.js
```

---

## ✅ Checklist

- [ ] Backup old database
- [ ] Backup new database (empty)
- [ ] Configure .env with connection strings
- [ ] Run migrations in sequence
- [ ] Verify data count matches
- [ ] Check for data quality issues
- [ ] Validate relationships
- [ ] Test search functionality
- [ ] Update frontend/backend references
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] Get user acceptance testing (UAT) approval
- [ ] Deploy to production

---

**Version:** 1.0  
**Last Updated:** December 2024  
**Status:** ✅ Ready for Use

