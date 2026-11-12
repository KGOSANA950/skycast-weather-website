import { LOTTIE_ICONS, LOTTIE_ICON_FALLBACKS } from './config.js';

// --- Weather Background Logic ---
let lightningInterval = null;

export function updateEnvironment(weatherCode, isDay) {
  const weatherBg = document.getElementById('weatherBg');
  const sunVisual = document.getElementById('sunVisual');
  const cloudLayer = document.getElementById('cloudLayer');
  const rainLayer = document.getElementById('rainLayer');
  const lightningLayer = document.getElementById('lightningLayer');

  weatherBg.classList.add('active');
  weatherBg.className = 'weather-bg active'; 
  sunVisual.classList.remove('active');
  cloudLayer.classList.remove('clouds-heavy');
  rainLayer.style.display = 'none';
  if (lightningInterval) { clearInterval(lightningInterval); lightningInterval = null; }

  const isRain = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82) || (weatherCode >= 95 && weatherCode <= 99) || weatherCode === 3;
  const isCloudy = weatherCode === 45 || weatherCode === 48 || (weatherCode >= 1 && weatherCode <= 2);

  if (isRain) weatherBg.classList.add('bg-rain');
  else if (isCloudy) weatherBg.classList.add('bg-clouds');
  else weatherBg.classList.add(isDay ? 'bg-clear-day' : 'bg-clear-night');

  if (isDay && !isRain && !isCloudy) sunVisual.classList.add('active');

  if (isRain) {
    cloudLayer.classList.add('clouds-heavy');
    rainLayer.style.display = 'block';
    createRain(rainLayer);
    startLightning(lightningLayer);
  } else if (isCloudy) {
    cloudLayer.classList.add('clouds-heavy');
  }
}

function createRain(rainLayer) {
  rainLayer.innerHTML = '';
  const dropCount = window.innerWidth < 600 ? 80 : 200;
  for (let i = 0; i < dropCount; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random() * 100 + 'vw';
    drop.style.animationDuration = (Math.random() * 0.2 + 0.3) + 's';
    drop.style.animationDelay = Math.random() * 1.5 + 's';
    drop.style.opacity = Math.random() * 0.4 + 0.5;
    drop.style.height = (Math.random() * 60 + 60) + 'px';
    rainLayer.appendChild(drop);
  }
}

function startLightning(lightningLayer) {
  if (lightningInterval) clearInterval(lightningInterval);
  lightningInterval = setInterval(() => {
    if (Math.random() > 0.4) {
      lightningLayer.classList.add('flash');
      setTimeout(() => lightningLayer.classList.remove('flash'), 400);
    }
  }, 5000);
}

window.forceWeather = function(type) {
  const weatherBg = document.getElementById('weatherBg');
  weatherBg.classList.add('active');
  weatherBg.className = 'weather-bg active';
  document.getElementById('sunVisual').classList.remove('active');
  document.getElementById('cloudLayer').classList.remove('clouds-heavy');
  document.getElementById('rainLayer').style.display = 'none';
  if (lightningInterval) clearInterval(lightningInterval);

  if (type === 'sun') { weatherBg.classList.add('bg-clear-day'); document.getElementById('sunVisual').classList.add('active'); }
  else if (type === 'cloud') { weatherBg.classList.add('bg-clouds'); document.getElementById('cloudLayer').classList.add('clouds-heavy'); }
  else if (type === 'rain') {
    weatherBg.classList.add('bg-rain'); document.getElementById('cloudLayer').classList.add('clouds-heavy');
    document.getElementById('rainLayer').style.display = 'block';
    createRain(document.getElementById('rainLayer')); startLightning(document.getElementById('lightningLayer'));
  }
};

// --- Icons Helpers ---
export function getLottieKey(code, isDay) {
  if (code === 0) return isDay ? 'sun' : 'moon';
  if (code === 1 || code === 2) return isDay ? 'partlyCloudy' : 'partlyCloudyNight';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'rain';
  if (code >= 61 && code <= 67) return 'heavyRain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'heavyRain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'unknown';
}

export function getWeatherDesc(code) {
  const map = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Depositing rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Dense drizzle',56:'Light freezing drizzle',57:'Dense freezing drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',66:'Light freezing rain',67:'Heavy freezing rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',77:'Snow grains',80:'Slight rain showers',81:'Moderate rain showers',82:'Violent rain showers',85:'Slight snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with slight hail',99:'Thunderstorm with heavy hail'};
  return map[code] || 'Unknown';
}

// --- Rendering Functions ---
export function renderMainWeather(data, displayName) {
  document.getElementById('cityName').textContent = displayName;
  document.getElementById('tempValue').textContent = Math.round(data.current.temperature_2m);
  document.getElementById('feelsLike').textContent = `Feels like ${Math.round(data.current.apparent_temperature)}°C`;
  document.getElementById('weatherDesc').textContent = getWeatherDesc(data.current.weather_code);
  
  const isDay = data.current.is_day === 1;
  const lottieKey = getLottieKey(data.current.weather_code, isDay);
  const iconContainer = document.getElementById('weatherIconLarge');
  
  iconContainer.innerHTML = `<lottie-player src="${LOTTIE_ICONS[lottieKey]}" background="transparent" speed="1" loop autoplay></lottie-player>`;
  
  const player = iconContainer.querySelector('lottie-player');
  player.addEventListener('error', () => {
    const fb = LOTTIE_ICON_FALLBACKS[lottieKey];
    iconContainer.innerHTML = `<i class="fas ${fb.icon}" style="color: ${fb.color}; font-size: 4rem;"></i>`;
  });

  document.getElementById('humidity').textContent = `${data.current.relative_humidity_2m}%`;
  document.getElementById('windSpeed').textContent = `${Math.round(data.current.wind_speed_10m)} km/h`;
  document.getElementById('pressure').textContent = `${Math.round(data.current.surface_pressure)} hPa`;
  document.getElementById('visibility').textContent = (data.current.visibility != null) ? `${(data.current.visibility / 1000).toFixed(1)} km` : 'N/A';
}

export function renderHourlyChart(hourlyData) {
  const chartEl = document.getElementById('hourlyChart');
  chartEl.innerHTML = ''; 
  
  const now = new Date();
  const currentHourISO = now.toISOString().slice(0, 13); 
  let startIndex = hourlyData.time.findIndex(t => t.startsWith(currentHourISO));
  if (startIndex === -1) startIndex = 0; 

  const next24Time = hourlyData.time.slice(startIndex, startIndex + 24);
  const next24Temp = hourlyData.temperature_2m.slice(startIndex, startIndex + 24);
  const next24Code = hourlyData.weather_code.slice(startIndex, startIndex + 24);

  const minTemp = Math.min(...next24Temp);
  const maxTemp = Math.max(...next24Temp);
  const range = maxTemp - minTemp || 1; 
  
  const chartHeight = 60; 
  const chartTopPadding = 20;
  let points = [];

  next24Time.forEach((timeStr, i) => {
    const date = new Date(timeStr);
    const hourLabel = date.getHours().toString().padStart(2, '0') + ':00';
    const temp = next24Temp[i];
    const code = next24Code[i];
    
    const lottieKey = getLottieKey(code, true);
    const fb = LOTTIE_ICON_FALLBACKS[lottieKey];

    const normalizedTemp = (temp - minTemp) / range; 
    const yPos = chartHeight - (normalizedTemp * chartHeight) + chartTopPadding;
    const xPos = (i / 23) * 100; 
    points.push(`${xPos},${yPos}`);

    const pointDiv = document.createElement('div');
    pointDiv.className = 'hour-point';
    pointDiv.innerHTML = `
      <div class="hour-temp-bubble">${Math.round(temp)}°C</div>
      <div class="hour-icon-container">
        <lottie-player src="${LOTTIE_ICONS[lottieKey]}" background="transparent" speed="1" loop autoplay></lottie-player>
      </div>
      <span class="hour-label">${hourLabel}</span>
    `;
    
    const lottiePlayer = pointDiv.querySelector('lottie-player');
    lottiePlayer.addEventListener('error', () => {
      pointDiv.querySelector('.hour-icon-container').innerHTML = `<i class="fas ${fb.icon}" style="color: ${fb.color}; font-size: 1.2rem;"></i>`;
    });

    chartEl.appendChild(pointDiv);
  });

  const polylinePoints = points.join(' ');
  const areaPoints = `0,120 ${polylinePoints} 100,120`;

  chartEl.insertAdjacentHTML('afterbegin', `
    <svg class="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffd966" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#ffd966" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#chartGradient)" />
      <polyline points="${polylinePoints}" fill="none" stroke="#ffd966" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `);
}

export function renderForecast(dailyData) {
  const container = document.getElementById('forecastContainer');
  const days = [];
  
  for (let i = 1; i < Math.min(6, dailyData.time.length); i++) {
    days.push({
      date: new Date(dailyData.time[i]),
      code: dailyData.weather_code[i],
      max: dailyData.temperature_2m_max[i],
      min: dailyData.temperature_2m_min[i]
    });
  }

  container.innerHTML = days.map(d => {
    const lottieKey = getLottieKey(d.code, true);
    return `
      <div class="forecast-card">
        <div class="forecast-day">${d.date.toLocaleDateString('en-US',{weekday:'short'})}</div>
        <div class="forecast-icon">
          <lottie-player src="${LOTTIE_ICONS[lottieKey]}" background="transparent" speed="1" loop autoplay></lottie-player>
        </div>
        <div class="forecast-temp">${Math.round(d.max)}° <span class="low">/ ${Math.round(d.min)}°</span></div>
      </div>`;
  }).join('');

  container.querySelectorAll('lottie-player').forEach((player, idx) => {
    const lottieKey = getLottieKey(days[idx].code, true);
    const fb = LOTTIE_ICON_FALLBACKS[lottieKey];
    player.addEventListener('error', () => {
      player.parentElement.innerHTML = `<i class="fas ${fb.icon}" style="color: ${fb.color}; font-size: 2rem;"></i>`;
    });
  });
}

export function updateSunTracker(sunriseStr, sunsetStr) {
  const now = new Date();
  const sunrise = new Date(sunriseStr);
  const sunset = new Date(sunsetStr);
  const arcProgressEl = document.getElementById('arcProgress');
  const arcIconEl = document.getElementById('arcIcon');

  document.getElementById('sunriseTime').textContent = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('sunsetTime').textContent = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let progress = 0;
  let isNight = false;

  if (now >= sunrise && now <= sunset) {
    progress = (now - sunrise) / (sunset - sunrise);
  } else if (now > sunset) {
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
    progress = (now - sunset) / (midnight - sunset); 
    if (progress > 1) progress = 1; isNight = true;
  } else {
    const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
    progress = (midnight - now) / (midnight - sunrise); 
    if (progress > 1) progress = 1; isNight = true;
  }

  const t = Math.max(0, Math.min(1, progress)); 
  const x = (1-t)*(1-t)*0 + 2*(1-t)*t*50 + t*t*100;
  const y = (1-t)*(1-t)*45 + 2*(1-t)*t*0 + t*t*45;

  arcIconEl.style.left = `${(x / 100) * 100}%`;
  arcIconEl.style.top = `${(y / 50) * 100}%`;

  if (isNight) {
    arcIconEl.classList.add('moon');
    arcIconEl.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    arcIconEl.classList.remove('moon');
    arcIconEl.innerHTML = '<i class="fas fa-sun"></i>';
  }

  const pathLength = arcProgressEl.getTotalLength();
  arcProgressEl.style.strokeDasharray = pathLength;
  arcProgressEl.style.strokeDashoffset = pathLength - (pathLength * t);
}