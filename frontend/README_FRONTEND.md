# Frontend (Next.js + Tailwind) — My Website

This folder contains a minimal Next.js + TypeScript frontend scaffold using Tailwind CSS.

Quick start

1. Install dependencies

```powershell
cd "c:\Users\ANITA DEVI\OneDrive\Desktop\my-website\frontend"
npm install
```

2. Start dev server

```powershell
npm run dev
```

The site will run on `http://localhost:3001` by default.

Notes
- The contact form posts to an API at `window.API_BASE` or `http://localhost:3000` by default. Adjust `window.API_BASE` in your browser console or deploy config.
- Tailwind is configured in `tailwind.config.js`.
- Firebase / Stripe placeholders are included as dependencies — you'll need to add configuration and keys.

Next steps (I can implement):
- Add Firebase Auth (client + server verification)
- Integrate Stripe Elements and server webhook handling
- Add product pages and cart flow
- Connect frontend to relational API for orders/products

