# RedRelay

Emergency blood requests matched to nearby voluntary donors. Donor phone numbers never leave the server.

**Stack:** React + Vite + React Router, Express, JSON file storage, Leaflet/OpenStreetMap.

## Run it
```
npm run setup     # installs root, server and client
npm run dev       # API on :5000, site on http://localhost:5173
```
Production: `npm run build && npm start`, then open http://localhost:5000.
Delete `server/data.json` to reset to the seeded demo data (30 donors, 5 requests).

## Demo script
1. Post an SOS: 2 units of B+ at Apollo Hospital, 4 hours.
2. Open it: the matcher lists B+, B-, O+, O- donors, nearest first. Move the radius slider.
3. Top right, "Viewing as": pick an O+ donor, click **I can donate**. The card shows 1/2 units and the stepper moves to Donors Responded.
4. Another donor commits the last unit: Fulfilled / In Transit.
5. **Mark blood received** closes it and locks those donors for 90 days. Their profile page then offers a certificate.

## How the rules work
- `server/logic.js`: ABO/Rh matrix, haversine distance, 90 day lock, status derivation, donor masking.
- Status is computed from units committed and the clock, so requests auto-close at their deadline (no ghost requests).
- The API only ever returns initials, blood group and locality for donors.
