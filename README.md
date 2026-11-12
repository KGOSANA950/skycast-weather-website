# ⛅ SkyCast - Immersive Weather Website

An interactive, fully responsive weather application built with pure Vanilla JavaScript. It features dynamic background animations, voice search, a custom NLP chatbot, and live weather data from the Open-Meteo API.

## 🚀 Live Demo
👉 **[View the Live App Here](https://[YOUR-GITHUB-USERNAME].github.io/skycast-weather-website/)**

## ✨ Features
*   **Immersive Backgrounds:** Real-time animated rain, moving clouds, and a glowing sun based on live weather codes.
*   **Voice Search & TTS:** Integrated Web Speech API to search for cities using your voice and have the bot read the forecast.
*   **Custom SVG Chart:** A dynamic, hover-interactive 24-hour temperature graph.
*   **NLP Chatbot:** A rule-based chatbot that can answer questions like *"Will it rain in Paris tomorrow?"* without relying on external LLM APIs.
*   **Lottie Animations:** High-quality vector animations for all weather icons.
*   **GPS Location:** Automatically fetches weather for your current location.
*   **Favorites:** Save cities to LocalStorage.
*   **Parallax Effects:** Background elements react to your mouse movement.

## 🛠️ Tech Stack
*   HTML5
*   CSS3 (Flexbox, Grid, Custom Properties, Animations)
*   Vanilla JavaScript (ES6 Modules)
*   [Open-Meteo API](https://open-meteo.com/) (Weather & Geocoding)
*   [LottieFiles](https://lottiefiles.com/) (Vector Animations)

## 📂 Project Structure
```text
├── index.html
├── css/
│   ├── style.css
│   └── chat.css
└── js/
    ├── config.js
    ├── api.js
    ├── ui.js
    └── main.js
