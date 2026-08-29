# Weather

Simple Weather Dashboard using Open‑Meteo (no API key). Built with plain HTML, CSS and JavaScript.

## Overview

This is a lightweight client-side weather dashboard that:

- Searches cities with geocoding (Open‑Meteo Geocoding API)
- Fetches current conditions, next 24‑hour hourly summary, and a 7‑day forecast using the Open‑Meteo Forecast API
- Supports using your current location (browser Geolocation)
- Switches units between Celsius/kmh and Fahrenheit/mph (persisted to localStorage)
- Responsive layout and simple UI (no build tools required)

## Files

- `index.html` — main page and UI markup
- `styles.css` — styling and layout
- `script.js` — all client-side logic (geocoding, fetching, rendering, unit toggle)
- `README.md` — this file

## How it’s built

- Tech: HTML5, CSS3, vanilla JavaScript (no frameworks)
- APIs:
  - Open‑Meteo Geocoding API for converting city names → lat/lon
  - Open‑Meteo Forecast API for current, hourly, and daily weather (no API key)
- Weather icons and descriptions are mapped from Open‑Meteo's WMO weather codes.
- Audio/sound is not included in this version (optional enhancement).
- No server required — it runs entirely in the browser.

## How to run locally

1. Clone the repository:
   git clone git@github.com:pyneutron/weather.git
2. Open `index.html` in a browser:
   - You can open the file directly (file://), but for best behavior use a simple HTTP server:
     - Python 3: `python -m http.server 8000` then open `http://localhost:8000`
     - Node: `npx http-server` (or any static server)
3. Use the search box to find a city or click the location (📍) button to use your current location.
4. Toggle units using the unit switch.

That's it. :)
