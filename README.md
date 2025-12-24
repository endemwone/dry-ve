<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</p>

<h1 align="center">🌧️ Dry-ve</h1>

<p align="center">
  <strong>Find the driest route to your destination</strong><br>
  <em>A smart route planner that analyzes real-time rain probability along your path</em>
</p>

---

## ✨ Features

- 🗺️ **Interactive Map** — Click anywhere to set your start and destination points
- 🌦️ **Real Weather Data** — Fetches live precipitation probability from [Open-Meteo](https://open-meteo.com/)
- 🚗 **Smart Routing** — Uses [OSRM](https://project-osrm.org/) for accurate driving directions with alternatives
- 📊 **Rain Score** — Routes are ranked by their likelihood of staying dry
- 🎨 **Color-Coded Paths** — Instantly see which routes have rain risk (green = dry, red = heavy rain)
- 💡 **Recommendations** — Get plain-English advice like "Dry route!" or "Rainy sections ahead"

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/endemwone/dry-ve.git
cd dry-ve

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎯 How It Works

1. **Click on the map** to set your **Start** point (first click) and **Destination** (second click).
2. Press **Find Safe Routes** — the app fetches driving routes from OSRM.
3. For each route, Dry-ve samples **10 points** and queries Open-Meteo for rain probability.
4. Routes are scored and ranked — the **Best Route** is shown at the top with a recommendation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS |
| Map | Leaflet + React-Leaflet |
| Routing API | OSRM (free, no key required) |
| Weather API | Open-Meteo (free, no key required) |
| Build Tool | Vite |

---

## 📸 Screenshot

> *Click two points → Get the driest route in seconds!*

![Dry-ve Screenshot](https://via.placeholder.com/800x450?text=Dry-ve+Screenshot)

---

## 📝 Roadmap

- [ ] Add departure time picker for future weather forecasts
- [ ] Support for walking/cycling modes
- [ ] Persistent route history
- [ ] Mobile-responsive design improvements
- [ ] Self-hosted OSRM for production use

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check out the [issues page](https://github.com/endemwone/dry-ve/issues).

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Made with ☂️ by <a href="https://github.com/endemwone">endemwone</a>
</p>
