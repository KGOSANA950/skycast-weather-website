import { fetchCitySuggestions, fetchWeatherByCity, fetchWeatherByCoords, reverseGeocode } from './api.js';
import { updateEnvironment, renderMainWeather, renderHourlyChart, renderForecast, updateSunTracker, getWeatherDesc } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const cityInput = document.getElementById('cityInput');
  const searchBtn = document.getElementById('searchBtn');
  const suggestionsList = document.getElementById('suggestionsList');
  const micBtn = document.getElementById('micBtn');
  const gpsBtn = document.getElementById('gpsBtn');
  const statusMessageEl = document.getElementById('statusMessage');
  const favToggleBtn = document.getElementById('favToggleBtn');
  const favoritesBar = document.getElementById('favoritesBar');
  const ttsToggle = document.getElementById('ttsToggle');

  // --- State ---
  let currentCityData = { name: 'London', lat: 51.5074, lon: -0.1278 };
  let favorites = JSON.parse(localStorage.getItem('skycast_favorites')) || [];
  let suggestionItems = [];
  let activeIndex = -1;
  let debounceTimer = null;
  let currentAbortController = null;
  let ttsEnabled = false;
  const synth = window.speechSynthesis;

  // --- Helper Functions ---
  function setStatus(message, isError = false) {
    statusMessageEl.innerHTML = `<i class="fas ${isError ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i> <span>${message}</span>`;
    statusMessageEl.classList.toggle('error-message', isError);
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function countryFlag(code) {
    if (!code) return '';
    try { return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0))); } catch(e) { return ''; }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // --- Main App Flow ---
  async function loadWeather(lat, lon, displayName) {
    setStatus(`Fetching weather for ${displayName}...`);
    document.getElementById('cityName').textContent = displayName;
    currentCityData = { name: displayName, lat, lon };
    
    try {
      const weatherData = await fetchWeatherByCoords(lat, lon);
      
      updateEnvironment(weatherData.current.weather_code, weatherData.current.is_day === 1);
      renderMainWeather(weatherData, displayName);
      renderHourlyChart(weatherData.hourly);
      renderForecast(weatherData.daily);
      
      document.getElementById('dateTime').textContent = formatDate(new Date());
      if (weatherData.daily.sunrise && weatherData.daily.sunset) {
        updateSunTracker(weatherData.daily.sunrise[0], weatherData.daily.sunset[0]);
      }

      updateStarButton();
      setStatus(`Updated: ${displayName} · ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  async function loadWeatherByCity(cityName) {
    setStatus('Searching for location...');
    try {
      const locData = await fetchWeatherByCity(cityName);
      await loadWeather(locData.latitude, locData.longitude, locData.displayName);
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  // --- Autocomplete Logic ---
  async function fetchSuggestions(query) {
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();
    
    suggestionsList.innerHTML = `<div class="loading-suggestions"><i class="fas fa-spinner"></i>Searching locations...</div>`;
    suggestionsList.classList.add('visible');

    try {
      suggestionItems = await fetchCitySuggestions(query);
      renderSuggestions();
    } catch (err) {
      if (err.name !== 'AbortError') suggestionsList.innerHTML = `<div class="no-suggestions">Could not load suggestions</div>`;
    }
  }

  function renderSuggestions() {
    if (suggestionItems.length === 0) {
      suggestionsList.innerHTML = `<div class="no-suggestions">No matches found. Try another spelling.</div>`;
      activeIndex = -1;
      return;
    }
    suggestionsList.innerHTML = suggestionItems.map((s, idx) => {
      const flag = countryFlag(s.country_code);
      const regionParts = [s.admin1, s.country].filter(Boolean);
      return `
        <div class="suggestion-item" data-index="${idx}" role="option" tabindex="-1">
          <div class="city-line"><i class="fas fa-location-dot"></i><span>${escapeHtml(s.name)}</span></div>
          ${regionParts.length ? `<div class="region-line"><span class="flag">${flag}</span>${escapeHtml(regionParts.join(', '))}</div>` : ''}
        </div>`;
    }).join('');
    
    suggestionsList.querySelectorAll('.suggestion-item').forEach(el => {
      el.addEventListener('mousedown', (e) => { 
        e.preventDefault(); 
        const idx = parseInt(el.dataset.index, 10);
        const s = suggestionItems[idx];
        cityInput.value = [s.name, s.admin1, s.country].filter(Boolean).join(', ');
        hideSuggestions();
        loadWeather(s.latitude, s.longitude, cityInput.value);
      });
    });
    suggestionsList.classList.add('visible');
    activeIndex = -1;
  }

  function hideSuggestions() { suggestionsList.classList.remove('visible'); suggestionItems = []; activeIndex = -1; }

  // --- Favorites Logic ---
  function renderFavorites() {
    if (favorites.length === 0) { favoritesBar.style.display = 'none'; return; }
    favoritesBar.style.display = 'flex';
    
    favoritesBar.innerHTML = favorites.map((fav, index) => `
      <div class="fav-chip" data-index="${index}" title="${escapeHtml(fav.name)}">
        <i class="fas fa-location-dot"></i><span>${escapeHtml(fav.name.split(',')[0])}</span>
        <i class="fas fa-times remove-fav" data-remove="${index}"></i>
      </div>
    `).join('');

    favoritesBar.querySelectorAll('.fav-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-fav')) return;
        const fav = favorites[parseInt(chip.dataset.index)];
        loadWeather(fav.lat, fav.lon, fav.name);
      });
    });

    favoritesBar.querySelectorAll('.remove-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        favorites.splice(parseInt(btn.dataset.remove), 1);
        localStorage.setItem('skycast_favorites', JSON.stringify(favorites));
        renderFavorites();
        updateStarButton();
      });
    });
  }

  function updateStarButton() {
    favToggleBtn.classList.toggle('active', favorites.some(f => f.name === currentCityData.name));
  }

  favToggleBtn.addEventListener('click', () => {
    if (favorites.some(f => f.name === currentCityData.name)) {
      favorites = favorites.filter(f => f.name !== currentCityData.name);
    } else {
      favorites.push(currentCityData);
    }
    localStorage.setItem('skycast_favorites', JSON.stringify(favorites));
    renderFavorites();
    updateStarButton();
  });

  // --- Voice & Audio ---
  let recognition = null;
  let isListening = false;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add('listening');
      micBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
      document.getElementById('listeningOverlay').classList.add('active');
    };
    recognition.onresult = (event) => {
      const cleaned = event.results[0][0].transcript.replace(/(weather|search|for|in|at|the city of)/gi, '').trim();
      cityInput.value = cleaned;
      hideSuggestions();
      loadWeatherByCity(cleaned);
    };
    recognition.onerror = (event) => {
      setStatus(event.error === 'not-allowed' ? "Mic access denied." : "Voice search error.", true);
    };
    recognition.onend = () => {
      isListening = false;
      micBtn.classList.remove('listening');
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      document.getElementById('listeningOverlay').classList.remove('active');
    };
  } else {
    micBtn.style.display = 'none';
  }

  micBtn.addEventListener('click', () => {
    if (!recognition) return;
    if (isListening) recognition.stop(); else recognition.start();
  });

  function speakText(text) {
    if (!ttsEnabled || !synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>?/gm, ''));
    utterance.rate = 1.05;
    synth.speak(utterance);
  }

  ttsToggle.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    ttsToggle.classList.toggle('active', ttsEnabled);
    ttsToggle.innerHTML = ttsEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
    if (ttsEnabled) speakText("Voice enabled.");
    else synth.cancel();
  });

  // --- GPS Logic ---
  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return setStatus("Geolocation not supported.", true);
    
    gpsBtn.classList.add('locating');
    gpsBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    setStatus("Locating... Please allow location access.");

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const displayName = await reverseGeocode(lat, lon);
      
      gpsBtn.classList.remove('locating');
      gpsBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
      loadWeather(lat, lon, displayName);
    }, (error) => {
      gpsBtn.classList.remove('locating');
      gpsBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
      setStatus("Location access denied or unavailable.", true);
    }, { enableHighAccuracy: true, timeout: 10000 });
  });

  // --- Initialization & Event Listeners ---
  cityInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    if (cityInput.value.trim().length < 2) { hideSuggestions(); return; }
    debounceTimer = setTimeout(() => fetchSuggestions(cityInput.value.trim()), 220);
  });

  document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    hideSuggestions();
    loadWeatherByCity(cityInput.value);
  });

  // --- Floating Chat Logic ---
  const chatBubble = document.getElementById('chatBubble');
  const chatPanel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const chatSend = document.getElementById('chatSend');
  const chatInput = document.getElementById('chatInput');

  chatBubble.addEventListener('click', () => { chatPanel.classList.add('open'); chatBubble.classList.add('hidden'); setTimeout(() => chatInput.focus(), 250); });
  chatClose.addEventListener('click', () => { chatPanel.classList.remove('open'); chatBubble.classList.remove('hidden'); });

  chatSend.addEventListener('click', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    handleUserMessage(text);
  });

  async function handleUserMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML += `<div class="msg user"><div class="avatar"><i class="fas fa-user"></i></div><div class="bubble">${escapeHtml(text)}</div></div>`;
    chatMessages.innerHTML += `<div class="msg bot typing" id="typingIndicator"><div class="avatar"><i class="fas fa-robot"></i></div><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    await new Promise(r => setTimeout(r, 600));
    document.getElementById('typingIndicator').remove();

    // Very simple NLP bot logic
    let reply = "I'm not sure what you mean. Try asking 'weather in London'.";
    const m = text.toLowerCase();
    
    if (/(hi|hello|hey)/.test(m)) reply = `Hey there 👋 I'm your weather bot. Try <em>"weather in Tokyo"</em>.`;
    else if (/(rain)/.test(m)) reply = `Let me check the forecast for rain. (You asked about: ${text})`;
    else reply = `I heard you say "${text}". In the full version, I would fetch this data!`;

    chatMessages.innerHTML += `<div class="msg bot"><div class="avatar"><i class="fas fa-robot"></i></div><div class="bubble">${reply}</div></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    speakText(reply);
  }

  // --- Run on load ---
  renderFavorites();
  loadWeatherByCity('London');
  
  // Add Mouse Parallax
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX - window.innerWidth / 2) / 40;
    const y = (e.clientY - window.innerHeight / 2) / 40;
    document.getElementById('sunVisual').style.transform = `translate(${-x * 2}px, ${-y * 2}px)`;
    document.getElementById('cloudLayer').style.transform = `translate(${-x * 0.5}px, ${-y * 0.5}px)`;
    document.getElementById('weatherApp').style.transform = `rotateX(${y * 0.05}deg) rotateY(${x * 0.05}deg)`;
  });
});