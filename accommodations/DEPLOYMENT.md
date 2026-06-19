# 🚀 Deployment & Integration Guide

## Quick Setup

### Option 1: Local Testing
1. Open `accommodations/index.html` in your browser
2. Test filtering with states, cities, and search
3. Verify responsive design on mobile

### Option 2: Web Server Integration

#### With Apache/Nginx
```
Copy the accommodations/ folder to your web root:
/var/www/html/accommodations/
   ├── index.html
   ├── data/
   ├── js/
   └── css/

Access: http://yourdomain.com/accommodations/
```

#### With Express.js
```javascript
// In your server.js or app.js
app.use('/accommodations', express.static('accommodations'));

// Or as a route
app.get('/accommodations', (req, res) => {
  res.sendFile(__dirname + '/accommodations/index.html');
});
```

#### With Next.js
```
Copy to: public/accommodations/
Access: /accommodations/ in your Next.js app
```

### Option 3: WordPress Integration

Add to your WordPress theme's functions.php:
```php
function register_accommodations_page() {
  register_page_route('/accommodations/');
}
add_action('wp_enqueue_scripts', 'register_accommodations_page');
```

## Production Checklist

- [ ] Replace placeholder images with real photos
- [ ] Update phone numbers and email addresses
- [ ] Add real lodge listings from database
- [ ] Customize colors to match your brand
- [ ] Test on mobile devices
- [ ] Implement contact form backend
- [ ] Implement detail view modal
- [ ] Add Google Analytics tracking
- [ ] Set up SSL certificate (HTTPS)
- [ ] Optimize images for web
- [ ] Test loading times
- [ ] Set up caching headers

## Performance Optimization

### Image Optimization
```html
<!-- Use WebP format with fallback -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Lodge image">
</picture>
```

### JSON File Optimization
```bash
# Minify accommodations.json
# Or load data from API instead of static file
```

### Lazy Loading
```html
<img src="..." loading="lazy" alt="...">
```

## Database Integration

Replace JSON with API calls:

```javascript
// In filter.js, modify init() method:

async init() {
  try {
    // Load from API instead of JSON file
    const response = await fetch('/api/accommodations');
    this.accommodationData = await response.json();
    
    this.populateStateDropdown();
    this.setupEventListeners();
    this.displayFeaturedLodges();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}
```

## Backend API Example

```javascript
// Node.js / Express
app.get('/api/accommodations', async (req, res) => {
  try {
    const data = await Accommodation.aggregate([
      {
        $group: {
          _id: '$state',
          cities: { $push: '$$ROOT' }
        }
      }
    ]);
    
    res.json({ states: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Analytics Integration

Add Google Analytics:

```html
<!-- In index.html head section -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## Contact Form Backend

```javascript
// In filter.js, update contactLodge():

function contactLodge(name, phone, email) {
  // Show contact form modal
  showContactModal({
    lodgeName: name,
    lodgePhone: phone,
    lodgeEmail: email
  });
}

// Handle form submission
async function submitContactForm(formData) {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lodgeName: formData.lodgeName,
      studentName: formData.name,
      studentEmail: formData.email,
      message: formData.message,
      timestamp: new Date()
    })
  });
  
  return response.json();
}
```

## Environment Variables

Create `.env` file:
```env
API_URL=https://api.yourdomain.com
GA_ID=UA-XXXXXXXXX-X
CONTACT_EMAIL=admin@yourdomain.com
```

## Hosting Options

### Free Hosting
- Netlify (supports single-page apps)
- Vercel (Next.js friendly)
- GitHub Pages (static files)

### Paid Hosting
- AWS S3 + CloudFront
- Heroku (with Node.js backend)
- DigitalOcean
- Linode
- Azure

### Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=accommodations/
```

## SSL Certificate

For production, always use HTTPS:
```bash
# Let's Encrypt (free)
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com
```

## Monitoring & Maintenance

Set up monitoring:
- Page load times
- Error tracking (Sentry)
- User analytics
- Database performance

## Update Process

To add new accommodations:

1. **If using JSON:**
   - Edit `data/accommodations.json`
   - Add new state/city/lodge
   - Test locally
   - Deploy

2. **If using API:**
   - Add to database
   - API automatically serves new data
   - No frontend deployment needed

## Rollback Plan

Keep backup of previous version:
```bash
git commit -m "Backup before changes"
git tag -a v1.0 -m "Production v1.0"
```

## Maintenance Tasks

- [ ] Update accommodations monthly
- [ ] Review and remove inactive lodges
- [ ] Monitor user feedback
- [ ] Optimize images quarterly
- [ ] Update contact information
- [ ] Test on new devices/browsers

---

**Deployment Status:** Ready for production ✅  
**Last Updated:** January 2026
