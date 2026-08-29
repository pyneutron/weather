// Weather Dashboard using Open-Meteo (no API key).
// Features: search city (geocoding), use current location, unit toggle (C/F), current weather, 7-day forecast, next 24h hourly.

(() => {
  const el = id => document.getElementById(id);
  const searchInput = el('searchInput');
  const searchBtn = el('searchBtn');
  const geoBtn = el('geoBtn');
  const suggestionsEl = el('suggestions');
  const statusEl = el('status');
  const currentCard = el('currentCard');
  const hourlyCard = el('hourlyCard');
  const forecastCard = el('forecastCard');
  const locationEl = el('location');
  const timeEl = el('time');
  const currentIcon = el('currentIcon');
  const currentTemp = el('currentTemp');
  const currentDesc = el('currentDesc');
  const windEl = el('wind');
  const humidityEl = el('humidity');
  const precipEl = el('precip');
  const hourlyList = el('hourlyList');
  const forecastList = el('forecastList');
  const unitToggle = el('unitToggle');
  const unitLabel = el('unitLabel');

  // Units: metric by default
  let units = localStorage.getItem('weather_units') || 'metric'; // 'metric' or 'imperial'
  unitToggle.checked = units === 'imperial';
  unitLabel.textContent = units === 'imperial' ? '°F' : '°C';

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function setStatus(txt, isError = false) {
    statusEl.textContent = txt;
    statusEl.style.color = isError ? '#ffb4b4' : '';
  }

  // Map WMO weathercode (Open-Meteo) to emoji + label
  function weatherCodeToIcon(code) {
    // simplified mapping
    const map = {
      0: ['☀️','Clear'],
      1: ['🌤️','Mainly clear'],
      2: ['⛅','Partly cloudy'],
      3: ['☁️','Overcast'],
      45: ['🌫️','Fog'],
      48: ['🌫️','Depositing rime fog'],
      51: ['🌦️','Light drizzle'],
      53: ['🌦️','Moderate drizzle'],
      55: ['🌧️','Dense drizzle'],
      56: ['🌧️','Freezing drizzle'],
      57: ['🌧️','Freezing drizzle heavy'],
      61: ['🌧️','Slight rain'],
      63: ['🌧️','Rain'],
      65: ['🌧️','Heavy rain'],
      66: ['🌨️','Freezing rain'],
      67: ['🌨️','Heavy freezing rain'],
      71: ['🌨️','Snow fall'],
      73: ['🌨️','Snow'],
      75: ['🌨️','Heavy snow'],
      77: ['🌨️','Snow grains'],
      80: ['🌦️','Rain showers'],
      81: ['🌧️','Moderate showers'],
      82: ['⛈️','Violent showers'],
      85: ['🌨️','Snow showers light'],
      86: ['🌨️','Snow showers heavy'],
      95: ['⛈️','Thunderstorm'],
      96: ['⛈️','Thunderstorm with slight hail'],
      99: ['⛈️','Thunderstorm with heavy hail'],
    };
    return map[code] || ['❓','Unknown'];
  }

  // GEO: get coordinates by city name (Open-Meteo geocoding)
  async function geocode(name) {
    const q = encodeURIComponent(name);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=6&language=en&format=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Geocoding failed');
    const data = await r.json();
    return data.results || [];
  }

  // Fetch weather from Open-Meteo
  async function fetchWeather(lat, lon) {
    const temp_unit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const wind_unit = units === 'imperial' ? 'mph' : 'kmh';
    // request: current weather, daily 7-day, hourly for next 48h
    const params = [
      `latitude=${lat}`,
      `longitude=${lon}`,
      `current_weather=true`,
      `hourly=temperature_2m,relativehumidity_2m,precipitation_probability,windspeed_10m`,
      `daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode`,
      `timezone=auto`,
      `temperature_unit=${temp_unit}`,
      `windspeed_unit=${wind_unit}`
    ].join('&');
    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Weather fetch failed');
    const data = await r.json();
    return data;
  }

  // Render helpers
  function formatTimeISO(iso, tz) {
    const d = new Date(iso);
    return d.toLocaleString([], { hour: 'numeric', minute: '2-digit', weekday: 'short' });
  }
  function formatDateISO(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Render UI
  function renderCurrent(placeName, weather, hourly, daily) {
    currentCard.hidden = false;
    locationEl.textContent = placeName;
    timeEl.textContent = `Updated: ${new Date(weather.time).toLocaleString()}`;
    const [icon, label] = weatherCodeToIcon(daily && daily.weathercode ? daily.weathercode : weather.weathercode);
    currentIcon.textContent = icon;
    currentTemp.textContent = `${Math.round(weather.temperature)}°`;
    currentDesc.textContent = label;
    windEl.textContent = `${Math.round(weather.windspeed)} ${units === 'imperial' ? 'mph' : 'km/h'}`;
    // humidity from hourly - find matching hour index
    const idx = hourly.time.findIndex(t => t === weather.time);
    const humidity = idx >= 0 && hourly.relativehumidity_2m ? hourly.relativehumidity_2m[idx] : '--';
    humidityEl.textContent = humidity === '--' ? '--' : `${Math.round(humidity)}%`;
    // precipitation probability if available
    const pprob = idx >= 0 && hourly.precipitation_probability ? hourly.precipitation_probability[idx] : '--';
    precipEl.textContent = pprob === '--' ? '--' : `${Math.round(pprob)}%`;
  }

  function renderHourly(hourly) {
    hourlyCard.hidden = false;
    hourlyList.innerHTML = '';
    // take next 24 entries from hourly arrays
    const nowIndex = hourly.time.findIndex(t => new Date(t) >= new Date());
    const start = Math.max(0, nowIndex);
    const end = Math.min(hourly.time.length, start + 24);
    for (let i = start; i < end; i++) {
      const t = hourly.time[i];
      const temp = hourly.temperature_2m[i];
      const rh = hourly.relativehumidity_2m ? hourly.relativehumidity_2m[i] : null;
      const w = hourly.windspeed_10m ? hourly.windspeed_10m[i] : null;
      const item = document.createElement('div');
      item.className = 'hour-item';
      item.innerHTML = `<div class="label">${new Date(t).toLocaleTimeString([], {hour:'numeric'})}</div>
                        <div>${Math.round(temp)}°</div>
                        <div class="label">${rh?Math.round(rh)+'%':''}</div>
                        <div class="label">${w?Math.round(w):''}</div>`;
      hourlyList.appendChild(item);
    }
  }

  function renderForecast(daily) {
    forecastCard.hidden = false;
    forecastList.innerHTML = '';
    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i];
      const max = daily.temperature_2m_max[i];
      const min = daily.temperature_2m_min[i];
      const precip = daily.precipitation_sum ? daily.precipitation_sum[i] : 0;
      const code = daily.weathercode ? daily.weathercode[i] : 0;
      const [icon, label] = weatherCodeToIcon(code);
      const card = document.createElement('div');
      card.className = 'day-card';
      card.innerHTML = `<div class="date">${formatDateISO(date)}</div>
                        <div class="icon" style="font-size:26px">${icon}</div>
                        <div class="label">${label}</div>
                        <div class="range">${Math.round(max)}° / ${Math.round(min)}°</div>
                        <div class="label">Precip ${precip ? Math.round(precip) + ' mm' : '—'}</div>`;
      forecastList.appendChild(card);
    }
  }

  // Top-level search + fetch flow
  async function doSearchCity(name) {
    try {
      setStatus('Searching...');
      suggestionsEl.hidden = true;
      const results = await geocode(name);
      if (!results || results.length === 0) {
        setStatus('No locations found.', true);
        return;
      }
      // if multiple suggestions, show list
      if (results.length > 1) {
        suggestionsEl.innerHTML = '';
        results.forEach(r => {
          const li = document.createElement('li');
          li.textContent = `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`;
          li.addEventListener('click', () => {
            suggestionsEl.hidden = true;
            fetchAndRender(r.name, r.latitude, r.longitude);
          });
          suggestionsEl.appendChild(li);
        });
        suggestionsEl.hidden = false;
        setStatus('Select a location from suggestions.');
        return;
      }
      // single result
      const r = results[0];
      await fetchAndRender(`${r.name}${r.admin1? ', '+r.admin1: ''}, ${r.country}`, r.latitude, r.longitude);
    } catch (err) {
      console.error(err);
      setStatus('Search error: ' + err.message, true);
    }
  }

  async function fetchAndRender(placeLabel, lat, lon) {
    try {
      setStatus('Fetching weather data...');
      currentCard.hidden = hourlyCard.hidden = forecastCard.hidden = true;
      const data = await fetchWeather(lat, lon);
      // current weather in data.current_weather
      if (!data || !data.current_weather) {
        setStatus('No weather data returned', true);
        return;
      }
      // render
      setStatus(`Weather for ${placeLabel}`);
      const current = data.current_weather;
      // for humidity and other hourly fields, we use data.hourly
      const hourly = data.hourly || { time: [], temperature_2m: [] };
      const daily = data.daily || {};
      renderCurrent(placeLabel, current, hourly, daily);
      renderHourly(hourly);
      renderForecast(daily);
    } catch (err) {
      console.error(err);
      setStatus('Weather fetch error: ' + err.message, true);
    }
  }

  // Use user's current geolocation
  function useGeolocation() {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported', true);
      return;
    }
    setStatus('Getting your location…');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      // reverse geocode with Open-Meteo search? We'll call geocoding by coordinates via search with "name" empty not supported.
      // Instead, fetch weather and display coordinates as label.
      await fetchAndRender(`Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`, lat, lon);
    }, (err) => {
      setStatus('Geolocation error: ' + err.message, true);
    }, { enableHighAccuracy: false, timeout: 8000 });
  }

  // Event listeners
  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (!q) return;
    doSearchCity(q);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
    // simple live suggestions after 300ms debounce
  });

  let suggestTimer = 0;
  searchInput.addEventListener('input', () => {
    clearTimeout(suggestTimer);
    const q = searchInput.value.trim();
    if (!q) { suggestionsEl.hidden = true; return; }
    suggestTimer = setTimeout(async () => {
      try {
        const results = await geocode(q);
        suggestionsEl.innerHTML = '';
        if (!results || results.length === 0) { suggestionsEl.hidden = true; return; }
        results.slice(0,6).forEach(r => {
          const li = document.createElement('li');
          li.textContent = `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`;
          li.addEventListener('click', () => {
            suggestionsEl.hidden = true;
            fetchAndRender(`${r.name}${r.admin1? ', '+r.admin1: ''}, ${r.country}`, r.latitude, r.longitude);
          });
          suggestionsEl.appendChild(li);
        });
        suggestionsEl.hidden = false;
      } catch (err) {
        suggestionsEl.hidden = true;
      }
    }, 300);
  });

  geoBtn.addEventListener('click', useGeolocation);

  unitToggle.addEventListener('change', () => {
    units = unitToggle.checked ? 'imperial' : 'metric';
    unitLabel.textContent = unitToggle.checked ? '°F' : '°C';
    localStorage.setItem('weather_units', units);
    // if currently displayed, re-fetch to update units
    // get current displayed coords from location text (we stored placeLabel) - easiest: re-do last search if any
    const placeText = locationEl.textContent;
    // quick heuristic: if coordinates, try parse, else geocode placeText to coords
    if (!placeText) return;
    const coordsMatch = placeText.match(/Lat ([\d.-]+), Lon ([\d.-]+)/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]), lon = parseFloat(coordsMatch[2]);
      fetchAndRender(placeText, lat, lon);
    } else {
      // re-geocode the displayed place name
      (async () => {
        try {
          const res = await geocode(placeText);
          if (res && res.length) {
            const r = res[0];
            fetchAndRender(`${r.name}${r.admin1? ', '+r.admin1: ''}, ${r.country}`, r.latitude, r.longitude);
          }
        } catch (e) { /* ignore */ }
      })();
    }
  });

  // initial sample: show weather for user's city if possible via geolocation, else London sample
  (async () => {
    setStatus('Ready — search a city or use location');
    // Optionally: automatically detect location (ask permission) - commented out to avoid intrusive prompt.
    // navigator.geolocation.getCurrentPosition(pos => useGeolocation());
    // Show a friendly default
    await sleep(0);
  })();

})();
