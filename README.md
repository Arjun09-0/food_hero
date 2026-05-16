# 🍱 FoodHero — Food Donation Matching Platform

> Connecting surplus food with people who need it — built for hackathons, scaled for impact.

## Project Structure

```
mern_hack/
├── client/          ← React + Vite frontend (port 5173)
│   └── src/
│       ├── api/         ← Axios instance
│       ├── components/  ← Navbar, DonationCard, StatusBadge, MapPicker
│       ├── context/     ← AuthContext (JWT + role)
│       └── pages/       ← LoginPage, RegisterPage, DonorPage, VolunteerPage, AdminPage
└── server/          ← Node.js + Express backend (port 5001)
    ├── config/      ← db.js (MongoDB)
    ├── middleware/  ← authMiddleware.js (JWT + roles)
    ├── models/      ← User.js, Donation.js, Match.js
    ├── routes/      ← auth.js, donations.js, admin.js
    ├── utils/       ← haversine.js
    └── seed.js      ← Demo data
```

## Quick Start

### 1. Configure Database
Option A (recommended) — Atlas: Set `server/.env` with your MongoDB Atlas connection string.

Option B (quick local testing) — in-memory fallback: If you do not have valid Atlas credentials and only need to run the app locally for testing, set `ALLOW_MEMORY=true` in `server/.env`. This will start an in-memory MongoDB instance for the server and allow running `npm run seed` to create demo accounts.

### 2. Seed Demo Data
```powershell
cd server
npm run seed
```

### 3. Start Backend
```powershell
cd server
npm run dev
```

### 4. Start Frontend (new terminal)
```powershell
cd client
npm run dev
```

Open **http://localhost:5173**

## Demo Credentials

| Role      | Email                  | Password  |
|-----------|------------------------|-----------|
| Admin     | admin@foodhero.org     | admin123  |
| Donor     | donor@foodhero.org     | donor123  |
| Volunteer | vol1@foodhero.org      | vol123    |
| Volunteer | vol2@foodhero.org      | vol123    |

## Smart Matching Algorithm

```
Score = 0.6 × ProximityScore + 0.4 × ActivityScore

ProximityScore = max(0, 1 - distance_km / 50) × 100
ActivityScore  = min(deliveryCount, 50) × 2
```

## Urgency Tagging

| Condition | Tag |
|-----------|-----|
| Quantity > 20 kg OR pickup within 4 hours | 🔥 HIGH |
| Otherwise | ✅ LOW |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login + get JWT |
| POST | /donations | Post donation (triggers matching) |
| GET | /donations/open | Open donations for volunteer |
| GET | /donations/mine | Donor's own donations |
| GET | /donations/my-matches | Volunteer's assigned matches |
| PATCH | /donations/match/:id/accept | Accept match |
| PATCH | /donations/match/:id/pickup | Mark picked up |
| PATCH | /donations/match/:id/deliver | Mark delivered |
| GET | /admin/all | All donations (admin) |
| GET | /admin/stats | Summary stats (admin) |
