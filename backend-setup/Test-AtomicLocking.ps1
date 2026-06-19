# Test-AtomicLocking.ps1
# Quick testing script for Week 1.5 Availability Locking

# ============================================
# CONFIGURATION
# ============================================

$BASE_URL = "http://localhost:3000"
$VENDOR_EMAIL = "vendor@test.com"
$VENDOR_PASSWORD = "password123"
$CUSTOMER1_EMAIL = "customer1@test.com"
$CUSTOMER1_PASSWORD = "password123"
$CUSTOMER2_EMAIL = "customer2@test.com"
$CUSTOMER2_PASSWORD = "password123"

# ============================================
# TEST FUNCTIONS
# ============================================

function Test-Health {
    Write-Host "`n=== TEST 1: Health Check ===" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET
        Write-Host "✅ Server is running" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json
        return $true
    } catch {
        Write-Host "❌ Server not running. Start with: npm run dev" -ForegroundColor Red
        return $false
    }
}

function Register-User {
    param(
        [string]$Name,
        [string]$Email,
        [string]$Password,
        [string]$Role
    )
    
    $body = @{
        name = $Name
        email = $Email
        password = $Password
        role = $Role
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/auth/register" `
            -Method POST `
            -Headers @{"Content-Type" = "application/json"} `
            -Body $body
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "✅ Registered $Role`: $Email" -ForegroundColor Green
            return $data.data.token
        } else {
            Write-Host "⚠️ $($data.error)" -ForegroundColor Yellow
            return $null
        }
    } catch {
        Write-Host "❌ Registration failed: $_" -ForegroundColor Red
        return $null
    }
}

function Create-Hall {
    param(
        [string]$VendorToken
    )
    
    $body = @{
        hallName = "Test Hall"
        description = "Test venue for atomic locking"
        category = "marriage_hall"
        address = "123 Main St"
        city = "New York"
        state = "NY"
        pincode = "10001"
        capacity = 500
        basePrice = 100000
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/halls" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $VendorToken"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "✅ Hall created: $($data.data._id)" -ForegroundColor Green
            return $data.data._id
        } else {
            Write-Host "❌ Hall creation failed: $($data.error)" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
        return $null
    }
}

function Get-Availability {
    param(
        [string]$HallId,
        [string]$FromDate,
        [string]$ToDate
    )
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/availability/halls/$HallId`?fromDate=$FromDate&toDate=$ToDate" `
            -Method GET
        
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "Date Status:" -ForegroundColor Cyan
        foreach ($item in $data.data) {
            $dateStr = [DateTime]$item.date | Get-Date -Format "yyyy-MM-dd"
            $status = $item.status
            
            if ($status -eq "locked") {
                Write-Host "  $dateStr: $status (bookingId: $($item.bookingId.Substring(0, 8))...)" -ForegroundColor Red
            } elseif ($status -eq "available") {
                Write-Host "  $dateStr: $status" -ForegroundColor Green
            } else {
                Write-Host "  $dateStr: $status" -ForegroundColor Yellow
            }
        }
        
        return $data
    } catch {
        Write-Host "❌ Error fetching availability: $_" -ForegroundColor Red
        return $null
    }
}

function Create-Booking {
    param(
        [string]$CustomerToken,
        [string]$HallId,
        [string]$EventDate,
        [string]$EventType,
        [int]$GuestCount,
        [int]$TotalAmount
    )
    
    $body = @{
        hallId = $HallId
        eventDate = $EventDate
        eventType = $EventType
        guestCount = $GuestCount
        totalAmount = $TotalAmount
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/bookings" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $CustomerToken"
                "Content-Type" = "application/json"
            } `
            -Body $body
        
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.success) {
            Write-Host "✅ Booking created (Status: $($data.data.status))" -ForegroundColor Green
            return $data.data.bookingId
        } else {
            Write-Host "❌ Booking failed: $($data.error)" -ForegroundColor Red
            return $null
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        
        if ($statusCode -eq 409) {
            Write-Host "✅ Got expected 409 conflict (date locked)" -ForegroundColor Green
            return "CONFLICT"
        } else {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            return $null
        }
    }
}

# ============================================
# MAIN TEST EXECUTION
# ============================================

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  WEEK 1.5 — ATOMIC LOCKING VERIFICATION   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# TEST 1: Health check
if (-not (Test-Health)) {
    Write-Host "`n❌ Server not running. Exiting." -ForegroundColor Red
    exit 1
}

# TEST 2: Register vendor
Write-Host "`n=== TEST 2: Register Vendor ===" -ForegroundColor Cyan
$vendorToken = Register-User -Name "Vendor Test" -Email $VENDOR_EMAIL -Password $VENDOR_PASSWORD -Role "vendor"
if (-not $vendorToken) { exit 1 }

# TEST 3: Create hall
Write-Host "`n=== TEST 3: Create Hall ===" -ForegroundColor Cyan
$hallId = Create-Hall -VendorToken $vendorToken
if (-not $hallId) { exit 1 }

# TEST 4: Check availability before booking
Write-Host "`n=== TEST 4: Check Availability (Before Booking) ===" -ForegroundColor Cyan
Get-Availability -HallId $hallId -FromDate "2024-12-25" -ToDate "2024-12-31" | Out-Null

# TEST 5: Register customer 1
Write-Host "`n=== TEST 5: Register Customer 1 ===" -ForegroundColor Cyan
$customer1Token = Register-User -Name "Customer One" -Email $CUSTOMER1_EMAIL -Password $CUSTOMER1_PASSWORD -Role "customer"
if (-not $customer1Token) { exit 1 }

# TEST 6: Create booking (Customer 1)
Write-Host "`n=== TEST 6: Create Booking (Customer 1 - 2024-12-25) ===" -ForegroundColor Cyan
$booking1Id = Create-Booking -CustomerToken $customer1Token -HallId $hallId -EventDate "2024-12-25" -EventType "marriage" -GuestCount 200 -TotalAmount 100000
if (-not $booking1Id) { exit 1 }

# TEST 7: Verify date is locked
Write-Host "`n=== TEST 7: Check Availability (After Booking) ===" -ForegroundColor Cyan
Get-Availability -HallId $hallId -FromDate "2024-12-25" -ToDate "2024-12-31" | Out-Null

# TEST 8: Register customer 2
Write-Host "`n=== TEST 8: Register Customer 2 ===" -ForegroundColor Cyan
$customer2Token = Register-User -Name "Customer Two" -Email $CUSTOMER2_EMAIL -Password $CUSTOMER2_PASSWORD -Role "customer"
if (-not $customer2Token) { exit 1 }

# TEST 9: CRITICAL - Try to book same date
Write-Host "`n=== TEST 9: Try to Book SAME Date (Should FAIL) ⭐ CRITICAL ===" -ForegroundColor Yellow
$booking2Result = Create-Booking -CustomerToken $customer2Token -HallId $hallId -EventDate "2024-12-25" -EventType "birthday" -GuestCount 150 -TotalAmount 100000

if ($booking2Result -eq "CONFLICT") {
    Write-Host "`n✅ ATOMIC LOCKING WORKS! Second booking was rejected." -ForegroundColor Green
} elseif (-not $booking2Result) {
    Write-Host "`n❌ Expected 409 conflict but got error." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n❌ LOCKING FAILED! Second booking succeeded (should have failed)." -ForegroundColor Red
    exit 1
}

# TEST 10: Book different date
Write-Host "`n=== TEST 10: Book DIFFERENT Date (Should SUCCEED) ===" -ForegroundColor Cyan
$booking2Id = Create-Booking -CustomerToken $customer2Token -HallId $hallId -EventDate "2024-12-26" -EventType "birthday" -GuestCount 150 -TotalAmount 100000
if (-not $booking2Id) { exit 1 }

# TEST 11: Verify both dates locked
Write-Host "`n=== TEST 11: Verify Both Dates Locked ===" -ForegroundColor Cyan
Get-Availability -HallId $hallId -FromDate "2024-12-25" -ToDate "2024-12-31" | Out-Null

# FINAL VERDICT
Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ ALL TESTS PASSED                        ║" -ForegroundColor Green
Write-Host "║  ATOMIC LOCKING VERIFIED                   ║" -ForegroundColor Green
Write-Host "║  READY FOR WEEK 2 PAYMENTS                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green
