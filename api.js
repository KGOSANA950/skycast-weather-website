// API Endpoints
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const REVERSE_GEO_API = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

// Fetch city suggestions based on user typing
export async function fetchCitySuggestions(query) {
  const res = await fetch(`${GEO_API}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`);
  if (!res.ok) throw new Error('Network response not ok');
  const data = await res.json();
  return (data.results || []).map(r => ({
    name: r.name, admin1: r.admin1 || '', country: r.country || '',
    country_code: r.country_code || '',
    latitude: r.latitude, longitude: r.longitude
  }));
}

// Fetch weather data by coordinates
export async function fetchWeatherByCoords(lat, lon) {
  const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,surface_pressure,wind_speed_10m,visibility` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=8`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather service unavailable');
  return res.json();
}

// Fetch weather data by city name (Geocode -> Then fetch weather)
export async function fetchWeatherByCity(city) {
  if (!city || city.trim() === '') throw new Error('Please enter a city name');
  const geoRes = await fetch(`${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!geoRes.ok) throw new Error('Geocoding service unavailable');
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`City "${city}" not found. Try a different name.`);
  }
  const loc = geoData.results[0];
  const displayName = loc.admin1 ? `${loc.name}, ${loc.admin1}` : `${loc.name}, ${loc.country}`;
  
  return { latitude: loc.latitude, longitude: loc.longitude, displayName };
}

// Fetch city name from coordinates (Reverse Geocoding)
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`${REVERSE_GEO_API}?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      const cityName = data.city || data.locality || 'My Location';
      const admin = data.principalSubdivision || '';
      const country = data.countryName || '';
      return admin ? `${cityName}, ${admin}` : `${cityName}, ${country}`;
    }
  } catch (e) {
    console.warn('Reverse geocoding failed', e);
  }
  return 'My Location';
}
