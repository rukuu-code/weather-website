# Weather App

A small, dark-minimal weather lookup app built with React, Vite, and Tailwind CSS.
Search any city or use your current location to see current conditions and a
5-day forecast. Weather data comes from the free Open-Meteo API — no API key needed.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually http://localhost:5173).

## Deploy to Vercel

1. Push this folder to a GitHub repository (its own repo, or as a subfolder in
   an existing one — if it's a subfolder, set Vercel's "Root Directory" to match).
2. On vercel.com, click "Add New… → Project" and import the repo.
3. Vercel auto-detects Vite — leave the default build settings
   (Build Command: `npm run build`, Output Directory: `dist`).
4. Click Deploy.

## Notes

- Geolocation ("Use my location" button) requires the browser's location
  permission and works best on https (Vercel serves https by default).
- Weather icons are from `react-icons/wi` (Weather Icons set), mapped from
  Open-Meteo's WMO weather codes in `src/weatherCodes.js`.
