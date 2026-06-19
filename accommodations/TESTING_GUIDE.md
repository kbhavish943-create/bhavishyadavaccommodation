# ✅ Accommodation Feature - Quick Testing Guide

## 🚀 How to Test Locally

### Step 1: Navigate to Accommodation Folder
```bash
cd accommodations
```

### Step 2: Open in Browser
**Option A - Direct File Open:**
```
Right-click on index.html → Open with → Your Browser
```

**Option B - Local Server (Recommended):**
```bash
# Using Node.js http-server
npx http-server -p 8000 --gzip

# Then visit: http://localhost:8000
```

**Option C - Using Express/Other Server:**
```bash
node server.js
# or your preferred server
```

---

## 🧪 Test Cases

### Test 1: Initial Page Load
**Expected:**
- Page loads without errors
- Header visible with title "🏠 Find Your Perfect Accommodation"
- Filter section shows with state/city dropdowns
- Featured accommodations display in grid
- No console errors

**How to Check:**
1. Open `index.html`
2. Check browser console (F12 → Console tab)
3. Should show featured lodges: Bhavish Yadav, Elite Hostel, Premium Hostel, Tech City

---

### Test 2: State Selection
**Expected:**
- State dropdown shows all 5 states
- City dropdown remains disabled until state selected

**How to Test:**
1. Click "Select State" dropdown
2. Verify you see: Bihar, Uttar Pradesh, Delhi, Karnataka
3. Select "Bihar"
4. Verify "Select City" dropdown becomes enabled

---

### Test 3: City-State Cascade
**Expected:**
- After selecting state, only that state's cities appear
- Correct number of lodges for each city

**How to Test:**
1. Select "Bihar" state
2. Click city dropdown
3. Should see: Deoghar (3 lodges), Patna (2 lodges), Gaya (1 lodge)
4. Select "Deoghar"
5. Should display 3 lodge cards
6. Check stats: "Found 3 accommodation(s) in Deoghar"

---

### Test 4: Lodge Card Display
**Expected:**
- Lodge cards display correctly
- All information visible (name, rating, location, amenities)
- Images load properly (or show placeholder)
- Featured badge shows on featured lodges

**How to Test:**
1. With Deoghar selected
2. Verify cards show:
   - ⭐ Featured badge on Bhavish Yadav (should be first)
   - Lodge name
   - ⭐ Rating (e.g., 4.8)
   - Review count (e.g., 45 reviews)
   - Location and distance
   - Price range
   - Amenities with "+3 more"
   - Available room types as badges

---

### Test 5: Search Functionality
**Expected:**
- Real-time search filters lodges by name
- Case-insensitive matching
- Shows only matching lodges
- Shows "no results" message if no matches

**How to Test:**
1. With city selected, type in search box
2. Test searches:
   - Type "Alpha" → Should show only Alpha Boys Hostel
   - Type "scholar" → Should show Scholar's Haven
   - Type "xyz" → Should show no results message
   - Clear search → Should show all lodges again

---

### Test 6: Contact Button Click
**Expected:**
- Clicking "Contact Now" shows contact information
- Phone number displays correctly
- Email displays correctly

**How to Test:**
1. Click any "Contact Now" button
2. Alert should show format: "Contact [Name]\nPhone: [Number]\nEmail: [Email]"
3. Verify all fields have data (not empty or "undefined")

**Example Alert:**
```
Contact Alpha Boys Hostel
Phone: +91-9876543210
Email: alphahostel@gmail.com
```

---

### Test 7: View Details Button Click
**Expected:**
- Clicking "View Details" shows lodgeID

**How to Test:**
1. Click any "View Details" button
2. Alert shows: "Viewing details for lodge ID: [number]"

---

### Test 8: Responsive Design - Tablet
**Expected:**
- 2-column grid layout
- Touch-friendly buttons
- Readable text

**How to Test:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set width to 768px (iPad width)
4. Verify:
   - Cards display in 2 columns
   - Text remains readable
   - Buttons are tappable (48px+)
   - No horizontal scroll

---

### Test 9: Responsive Design - Mobile
**Expected:**
- 1-column grid layout
- Full-width cards
- Large touch targets

**How to Test:**
1. DevTools → Device toolbar
2. Set width to 375px (iPhone width)
3. Verify:
   - Single column layout
   - Cards full width
   - Dropdowns are easy to use
   - Search box is tappable
   - No horizontal scroll

---

### Test 10: Filter with Multiple States
**Expected:**
- Can switch between states
- Cities update when state changes
- Lodges update correctly

**How to Test:**
1. Select "Bihar"
2. Select "Deoghar" → Shows 3 lodges
3. Change state to "Uttar Pradesh"
4. Click city dropdown → Should show: Lucknow, Agra
5. Select "Lucknow" → Should show 2 lodges
6. Verify stats update

---

### Test 11: Browser Console (Developer Tools)
**Expected:**
- No JavaScript errors
- No 404 errors for resources
- Proper logs for debugging

**How to Test:**
1. Open DevTools (F12)
2. Go to Console tab
3. Should see NO red error messages
4. May see INFO logs about loading data
5. Network tab should show:
   - ✅ index.html - 200
   - ✅ css/style.css - 200
   - ✅ js/filter.js - 200
   - ✅ data/accommodations.json - 200

---

### Test 12: JSON Data Loads
**Expected:**
- Data loads without errors
- All lodges have required fields

**How to Test:**
1. Open Console (F12)
2. Type: `document.getElementById('lodgesContainer').querySelectorAll('.lodge-card').length`
3. Should return number of featured lodges (3 or more)
4. Verify featured lodges appear: Bhavish Yadav, Elite Hostel, Premium Hostel, Tech City

---

### Test 13: CSS Loads Correctly
**Expected:**
- Styles applied correctly
- No flash of unstyled content (FOUC)
- Proper colors and layouts

**How to Test:**
1. Check visual design:
   - ✅ Purple gradient header
   - ✅ White card backgrounds
   - ✅ Proper spacing and margins
   - ✅ Hover effects on buttons
   - ✅ Card elevation on hover

---

### Test 14: Special Characters in Names
**Expected:**
- Handles special characters safely
- No JavaScript errors from quotes or apostrophes

**How to Test (if data updated):**
1. Add lodge with apostrophe in name: "Mary's Hostel"
2. Click "Contact Now"
3. Should work without JavaScript errors
4. Alert should display correctly

---

### Test 15: Empty State Handling
**Expected:**
- Shows message when no lodges available
- No errors shown

**How to Test:**
1. Select state, then city with no lodges
2. Should show: "📍 No lodges available in [CityName]"
3. Should suggest checking other cities

---

## 🔍 Debugging Tips

### JavaScript Console Commands

**Check if data loaded:**
```javascript
console.log(window.accommodationFilter)
```

**View all featured lodges:**
```javascript
const featured = []; 
document.querySelectorAll('.featured-badge').forEach(el => {
  featured.push(el.parentElement.querySelector('.lodge-name').textContent)
});
console.log(featured)
```

**Count total visible cards:**
```javascript
document.querySelectorAll('.lodge-card').length
```

**Check if jQuery loaded (if used):**
```javascript
typeof jQuery !== 'undefined' ? 'jQuery loaded' : 'jQuery NOT loaded'
```

---

## 📋 Bug Report Template

If you find a bug, use this template:

```markdown
## Bug Title
[Brief description]

### Severity
[ ] Critical 🔴 | [ ] High 🟠 | [ ] Medium 🟡 | [ ] Low 🟢

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Environment
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Screen Size: [Desktop/Tablet/Mobile]
- Console Errors: [Yes/No - paste if yes]

### Screenshots
[Attach if possible]
```

---

## ✅ Checklist Before Deployment

- [ ] All tests passed locally
- [ ] No console errors in any browser
- [ ] Responsive design verified (all breakpoints)
- [ ] Touch interactions work on mobile
- [ ] All links work correctly
- [ ] Images load properly
- [ ] Contact information displays correctly
- [ ] Featured lodges show correctly
- [ ] Search functionality works
- [ ] Filtering works for all states/cities
- [ ] Performance is acceptable
- [ ] SEO tags are present

---

## 🚀 Deployment Command

```bash
# Copy to production server
cp -r accommodations/ /path/to/web/root/

# Or upload via FTP/SCP
scp -r accommodations/ user@server:/var/www/html/
```

---

## 📞 Quick Support

**Feature Location:** `/accommodations/`

**Key Files:**
- `index.html` - Main page
- `js/filter.js` - Logic (400+ lines)
- `css/style.css` - Styles (700+ lines)
- `data/accommodations.json` - Data (11 lodges)

**If testing on GitHub Pages:**
```
https://yourusername.github.io/my-website/accommodations/
```

---

**Happy Testing! 🎉**  
Report any bugs found to your development team.
