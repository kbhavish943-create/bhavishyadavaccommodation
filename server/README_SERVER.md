# Server (Node.js / Express) for My Website

This minimal Express server provides an API endpoint to receive contact form submissions and save them to the MySQL database.

## Requirements
- Node.js 18+ (or 16+)
- npm
- MySQL server with the database created from `database.sql`

## Setup
1. Copy `.env.example` -> `.env` and update values.

```bash
cd server
cp .env.example .env
# edit .env to set DB credentials
```

2. Install dependencies

```bash
npm install
```

3. Start the server (development)

```bash
npm run dev
```

4. Start the server (production)

```bash
npm start
```

## API
- POST `/api/contact` — accept JSON: `{ name, email, message }`
  - Returns `{ success: true, message: 'Thank you...', contact_id: <id> }` on success
- GET `/health` — health check

## Notes
- CORS is enabled for all origins (change `cors()` usage in `index.js` for a stricter policy)
- Uses `mysql2/promise` pool in `db.js`
- Make sure the `contacts` table exists (use `database.sql` to create it)

