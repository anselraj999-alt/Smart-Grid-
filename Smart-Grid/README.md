# SmartGrid AI

Smart Renewable Energy Load Forecasting & Grid Management demo: customer registration, login and an
energy dashboard. This project was one HTML file with everything in `localStorage`; it is now split into
separate folders and has a real backend.

```
Smart-Grid/
├── html/         index.html            page structure only
├── css/          styles.css            all styling
├── javascript/   config.js api.js app.js   plain JS (talks to the backend)
├── react/        Vite + React version of the same app
├── backend/      Node.js REST API (no npm packages needed)
└── extras/       Hello.c, Hello.cpp, a.exe   (your original practice files)
```

The `html/`+`css/`+`javascript/` version and the `react/` version look and behave the same and use the
same backend. Pick either one.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer. Always start the backend first.

**1. Backend** (required)

```bash
cd backend
npm start
```

It listens on http://localhost:4000 and creates the demo account **CUSTOMER001 / Demo@123**.
There is nothing to `npm install` - the backend only uses what ships with Node.

**2a. Plain HTML/CSS/JS version** - open http://localhost:4000/ (the backend serves `html/`, `css/`
and `javascript/`). You can also just double-click `html/index.html`, or use VS Code Live Server.

**2b. React version**

```bash
cd react
npm install
npm run dev
```

Open http://localhost:5173. In dev mode Vite forwards `/api` calls to the backend, so no extra setup.
`npm run build` creates `react/dist/` - set `VITE_API_BASE` (see `react/.env.example`) if the site and
API live on different domains.

## What the backend does

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/health` | - | Is the server up? |
| `GET /api/auth/check-userid/:userId` | - | `{ available: true/false }` |
| `POST /api/auth/register` | - | Create an account (201) |
| `POST /api/auth/login` | - | `{ token, customer }` |
| `GET /api/auth/me` | Bearer token | Who am I? (used to restore a session on refresh) |
| `GET /api/dashboard` | Bearer token | Stats, forecast series, renewables, alerts, grid status, reports |

Errors always look like `{ "error": "message" }` and that message is shown in the UI.
Send the token as `Authorization: Bearer <token>`.

How it works:

- **Storage** - accounts are saved in `backend/data/customers.json` (created automatically, git-ignored).
  `backend/src/db.js` is the only file that touches it, so switching to SQLite/PostgreSQL/MongoDB later
  means rewriting just that file.
- **Passwords** are hashed with scrypt and never stored or returned in plain form.
- **Aadhaar**: only the last 4 digits are kept (shown as `XXXX-XXXX-1234`). The form still says: use
  dummy numbers, never a real Aadhaar.
- **Login tokens** are standard HS256 JWTs that expire after 2 hours. The browser keeps the token in
  `sessionStorage`, so closing the tab logs you out, like the original.
- **Validation** runs again on the server (email, 10-digit phone, 12-digit Aadhaar, strong password,
  unique User ID and email). New rule: a User ID must be 3-32 characters (letters, numbers, `.`, `-`, `_`).
- **Rate limiting**: 20 login/register attempts per minute per IP.
- **CORS**: only the origins in `CORS_ORIGINS` may call the API from another site.
- **Dashboard numbers** are still demo data - the same values as the original file - in
  `backend/src/dashboardData.js`. Replace that function with real data when you have it; the frontends only
  depend on its shape.

## Settings

Copy `backend/.env.example` to `backend/.env` to change `PORT`, `JWT_SECRET`, `TOKEN_TTL_SECONDS`,
`CORS_ORIGINS`, and so on. If `JWT_SECRET` is empty in development, a random one is generated (everyone is
logged out when the server restarts). Plain HTML users: if the backend is on a different address, edit
`javascript/config.js`.

## Tests

```bash
cd backend
npm test
```

15 tests start the real server and check registration, login, protected routes, tampered/expired tokens,
duplicate accounts (including simultaneous sign-ups), CORS, rate limiting and the static file server.

## Before putting this on the internet

- Set `NODE_ENV=production` and a long random `JWT_SECRET` (the server refuses to start without one).
  Production mode also skips creating the public demo account.
- Set `CORS_ORIGINS` to your real site only (this removes the dev-only `null` origin).
- Serve everything over HTTPS (a reverse proxy such as nginx or Caddy).
- Replace the JSON file with a real database if you expect many users.
- Don't collect real Aadhaar numbers unless you have a legal basis and proper protection for them.
