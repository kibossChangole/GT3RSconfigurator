# GT3RS Configurator

A premium 3D car configurator for the Porsche 911 GT3RS and other models, built with [Three.js](https://threejs.org/) and [Vite](https://vitejs.dev/). This project features real-time 3D rendering, interactive controls, and a modern UI.

## Features

- 3D model viewer for multiple car models (GT3RS, G63, Range Rover, Maybach, and more)
- Realistic lighting and environment reflections
- Interactive camera controls (pan, zoom, orbit)
- Customizable paint and finishes
- Modern, responsive UI

## Live Assets

All 3D models and image assets are now hosted on **Firebase Storage** for fast and reliable delivery.

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure

```
index.html
src/
  main.js         # Main Three.js scene and logic
  counter.js      # Example counter module
  style.css       # Modern UI styles
  assets/         # (Legacy) Local assets, now on Firebase
public/           # 3D models and static files
```

## Dependencies

- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)

## Credits

- 3D models and assets © their respective owners
- UI inspired by Porsche design language

## License

This project is for educational and demonstration purposes.

---
