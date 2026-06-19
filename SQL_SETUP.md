# My Website - SQL Database Setup Guide

## Overview
This website now includes a complete SQL database backend for storing contact form submissions, features, and site content.

## Database Structure

### Tables

#### 1. **contacts** - Contact Form Submissions
- `id` (INT) - Primary key
- `name` (VARCHAR 255) - Visitor name
- `email` (VARCHAR 255) - Visitor email
- `message` (LONGTEXT) - Message content
- `submitted_at` (TIMESTAMP) - Auto-timestamped submission
- `ip_address` (VARCHAR 45) - Visitor IP
- `read_status` (BOOLEAN) - Mark as read/unread

#### 2. **users** - User Accounts (Future Auth)
- `id` (INT) - Primary key
- `username` (VARCHAR 100) - Unique username
- `email` (VARCHAR 255) - Unique email
- `password_hash` (VARCHAR 255) - Encrypted password
- `full_name` (VARCHAR 255) - Display name
- `created_at` (TIMESTAMP) - Account creation date
- `is_active` (BOOLEAN) - Account status
- `role` (ENUM) - 'admin' or 'user'

#### 3. **featured_items** - Videos/Hospitality Services/Ceremony Grounds
- `id` (INT) - Primary key
- `title` (VARCHAR 255) - Content title
- `description` (LONGTEXT) - Details
- `category` (ENUM) - 'video', 'hospitality_services', or 'ceremony_grounds'
- `thumbnail_url` (VARCHAR 500) - Image URL
- `content_url` (VARCHAR 500) - Media URL
- `release_date` (DATE) - Publication date
- `rating` (DECIMAL 3,1) - Star rating (0.0-5.0)
- `views` (INT) - View count
- `is_featured` (BOOLEAN) - Show on homepage

#### 4. **features** - Site Features/Services
- `id` (INT) - Primary key
- `name` (VARCHAR 255) - Feature name
- `description` (LONGTEXT) - Feature description
- `category` (VARCHAR 100) - Feature category
- `icon_name` (VARCHAR 50) - Emoji or icon reference
- `order_position` (INT) - Display order
- `is_active` (BOOLEAN) - Show/hide

#### 5. **gallery_items** - Gallery Images
- `id` (INT) - Primary key
- `title` (VARCHAR 255) - Image title
- `image_url` (VARCHAR 500) - Image URL
- `description` (TEXT) - Alt text/description
- `category` (VARCHAR 100) - Gallery category
- `display_order` (INT) - Ordering

#### 6. **settings** - Site Configuration
- `id` (INT) - Primary key
- `setting_key` (VARCHAR 100) - Unique setting name
- `setting_value` (LONGTEXT) - Configuration value
- `description` (TEXT) - Setting description

#### 7. **activity_log** - User Activity Tracking
- `id` (INT) - Primary key
- `user_id` (INT) - Foreign key to users
- `action` (VARCHAR 255) - Action performed
- `entity_type` (VARCHAR 100) - What entity was affected
- `entity_id` (INT) - ID of affected entity
- `ip_address` (VARCHAR 45) - User IP
- `user_agent` (TEXT) - Browser info
- `created_at` (TIMESTAMP) - When action occurred

## Setup Instructions

### Step 1: Import Database Schema
```bash
mysql -u root -p < database.sql
```

Or manually:
1. Open phpMyAdmin
2. Create new database: `my_website`
3. Go to Import tab
4. Select `database.sql`
5. Click Import

### Step 2: Configure PHP API
Edit `api.php` and update database credentials (lines 4-7):

```php
define('DB_HOST', 'localhost');     // Your MySQL host
define('DB_USER', 'root');          // Your MySQL username
define('DB_PASS', '');              // Your MySQL password
define('DB_NAME', 'my_website');    // Database name
```

### Step 3: Set Permissions
Make sure `api.php` is readable and executable:
```bash
chmod 644 api.php
chmod 755 .
```

### Step 4: Test Connection
Run a simple test:
```bash
curl "http://localhost/my-website/api.php?action=settings"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "site_title": "My Website",
    "contact_email": "kbhavish943@gmail.com",
    ...
  }
}
```

## API Endpoints

### Submit Contact Form
**POST** `/api.php?action=submit_contact`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here..."
}
```

Response:
```json
{
  "success": true,
  "message": "Thank you! Your message has been received...",
  "contact_id": 1
}
```

### Get All Contacts (Admin)
**GET** `/api.php?action=contacts&limit=50&offset=0`

### Get Contact Statistics
**GET** `/api.php?action=stats`

Response:
```json
{
  "success": true,
  "data": {
    "total_submissions": 15,
    "unread_count": 3,
    "last_submission": "2025-12-01 14:30:00",
    "unique_contacts": 12
  }
}
```

### Get Features
**GET** `/api.php?action=features&category=Performance`

### Get Site Settings
**GET** `/api.php?action=settings`

## Database Views

### contact_summary
Provides quick stats on contact submissions:
```sql
SELECT * FROM contact_summary;
```

### featured_content
Shows all featured items sorted by views:
```sql
SELECT * FROM featured_content;
```

## Common Queries

### Get unread contacts
```sql
SELECT * FROM contacts 
WHERE read_status = FALSE 
ORDER BY submitted_at DESC;
```

### Get features by category
```sql
SELECT * FROM features 
WHERE is_active = TRUE AND category = 'Performance' 
ORDER BY order_position;
```

### Update contact read status
```sql
UPDATE contacts 
SET read_status = TRUE 
WHERE id = 1;
```

### Get featured items
```sql
SELECT * FROM featured_items 
WHERE is_featured = TRUE 
ORDER BY views DESC;
```

## Security Notes

1. **Prepared Statements** - All queries use prepared statements to prevent SQL injection
2. **Input Validation** - Server-side validation of all user inputs
3. **Error Handling** - Errors logged, not exposed to client
4. **IP Logging** - All submissions log visitor IP for security

## Environment Variables (Optional)

For production, use environment variables:

```php
// .env file
DB_HOST=localhost
DB_USER=username
DB_PASS=password
DB_NAME=my_website

// Load in api.php:
$env = parse_ini_file('.env');
define('DB_HOST', $env['DB_HOST']);
```

## Backup & Restore

### Backup Database
```bash
mysqldump -u root -p my_website > backup.sql
```

### Restore Database
```bash
mysql -u root -p my_website < backup.sql
```

## Troubleshooting

### "Connection refused"
- Check MySQL is running: `sudo service mysql status`
- Verify credentials in `api.php`

### "Access denied for user"
- Update DB_USER and DB_PASS in `api.php`
- Check MySQL user permissions: `GRANT ALL ON my_website.* TO 'user'@'localhost';`

### Contact form not saving
- Check browser console for errors
- Verify `api.php` is in correct location
- Check MySQL error logs: `/var/log/mysql/error.log`

### CORS Issues
If API is on different domain, add to `api.php`:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

## Future Enhancements

1. User authentication system
2. Admin dashboard for managing content
3. Email notifications for new contacts
4. Content management interface
5. Analytics tracking
6. Search functionality
7. User comments/ratings
8. Newsletter subscription

---

**Contact Info:**
- Email: kbhavish943@gmail.com
- Phone: +91 87091 88179

**Default Timezone:** Asia/Kolkata
