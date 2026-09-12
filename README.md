# 🌌 AetherScribe AI — Spatial Air-Drawing Studio

[![Live Demo](https://img.shields.io/badge/Live_Demo-lohitwrite.netlify.app-00f0ff?style=for-the-badge&logo=netlify&logoColor=white)](https://lohitwrite.netlify.app/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands%2060FPS-00f0ff?style=flat)](https://developers.google.com/mediapipe)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Draw glowing neon strokes directly in 3D air on your live webcam with 60 FPS real-time MediaPipe hand tracking, kinetic particles, and a synchronized left writing pad!**

---

## 🌐 Live Website on Netlify

Click the link below to experience AetherScribe AI live directly in your browser:

### 🚀 **[https://lohitwrite.netlify.app/](https://lohitwrite.netlify.app/)**

---

## ✨ Features

- 🎥 **100% Full Webcam Feed**: Full-frame uncropped webcam feed (`object-fit: contain`) with edge-to-edge access across your entire screen.
- ⚡ **60 FPS Spatial Hand Tracking**: Sub-millimeter hand tracking powered by Google MediaPipe Hands.
- ✍️ **Synchronized Left Air-Writing Pad**:
  - Live mirroring of whatever you write in the air.
  - **Background Toggle**: Switch between cybernetic **`BLACK`** background and live original **`WEBCAM`** background.
- 🎨 **Dynamic Brush FX & Live Particles**:
  - 🔥 **Fire**: Real flame gradient (`#ff2200` $\to$ `#ff8800` $\to$ `#ffea00`), fiery glow, and floating rising embers.
  - ✨ **Stardust**: Cosmic stardust halo glow with twinkling star sparkle particles.
  - 〰️ **Ribbon**: Dynamic velocity-based line width.
  - ⚡ **Laser**: High-energy dual-core laser beam with blazing white core.
- 🎛️ **Dual Brush Controls**: Switch brush styles from either the **Top Bar** or the **Left Writing Panel** with two-way instant synchronization.
- ✌️ **Peace V-Sign Air Eraser**: Simply show two fingers (index + middle extended) to wipe away strokes with smooth neon pink feedback.
- 🧘 **FULL VIEW / Zen Mode**: Toggle all UI panels off (Hotkey: `Z`) for complete, unobstructed air-drawing.
- 🎵 **Web Audio Synthesizer**: Kinetic sound synthesis that shifts pitch in real time as your hand moves across the air.

---

## 🖐️ Hand Gesture Guide

| Gesture | Hand Pose | Action | Active Visual Feedback |
|:---:|:---:|:---:|:---:|
| ☝️ | **1 Finger (Index)** or Pinch | **Draw / Write** | Glowing Cyan Pill |
| ✌️ | **Peace (V)** (Index + Middle) | **Air Eraser** | Vibrant Neon Pink Wipe Glow |
| 🖐️ | **Open Palm** | **Hover & Aim** | Subtle White Aiming Glow |
| ✊ | **Fist** (All Folded) | **Pause / Hold** | Glowing Solar Amber Freeze Pill |
| 🤙 | **Shaka / Pinky** | **Clear Canvas** | Flame Orange Disintegration Glow |

---

## 🛠️ Deploying to Netlify (Quick Step-by-Step)

This repository includes a pre-configured [`netlify.toml`](./netlify.toml) file for seamless zero-config deployment.

### Option 1: Automatic Deployment via GitHub (Recommended)
1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: AetherScribe AI Spatial Air-Drawing Studio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```
2. Go to **[Netlify](https://app.netlify.com/)** and log in.
3. Click **"Add new site"** $\to$ **"Import an existing project"**.
4. Select **GitHub** and choose your repository.
5. Netlify will automatically detect the settings from `netlify.toml`:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **"Deploy site"**! Your website will be live in seconds.
7. Update the link at the top of this `README.md` with your generated `.netlify.app` URL.

### Option 2: Drag & Drop Deployment
1. Build the frontend locally:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Go to **[Netlify Drop](https://app.netlify.com/drop)**.
3. Drag and drop the `frontend/dist` folder into the Netlify Drop area.
4. Your site is instantly online!

---

## 💻 Running Locally

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- Webcam / Camera access

### 2. Setup Frontend
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in Chrome, Edge, or Brave.

### 3. Setup Backend (Optional AI Vision Analyzer)
```bash
# Open a new terminal and navigate to backend
cd backend

# Install dependencies
npm install

# Start backend server
node server.js
```
Backend API will run on **[http://localhost:5000](http://localhost:5000)**.

---

## 📂 Project Structure

```
ai writing/
├── .gitignore              # Git ignore configuration
├── netlify.toml            # Netlify build & redirect rules
├── README.md               # Project documentation & live links
├── frontend/               # Frontend Client (Vite + MediaPipe)
│   ├── index.html          # Main application viewport & HUD
│   ├── style.css           # Cybernetic design system & animations
│   ├── app.js              # 60 FPS spatial canvas & tracking engine
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build configuration
└── backend/                # Node.js API Server
    ├── server.js           # Express API with AI Vision Analyzer
    ├── drawings.json       # Gallery data storage
    └── package.json        # Backend dependencies
```

---

## 🛡️ Privacy & Permissions

- All hand tracking computations run **locally in your browser** using WebAssembly & WebGL via MediaPipe.
- No video feeds or camera frames are ever sent to any remote server or stored without your explicit action.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
