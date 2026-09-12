/**
 * ==========================================================================
 * AETHERSCRIBE AI — Master Fullscreen Webcam Air-Drawing Engine
 * With Real-time Left Writing Display & Voice Feedback
 * ==========================================================================
 */

// 1. CONSTANTS & CONFIGURATION
const NEON_COLORS = [
  { name: 'Cyber Cyan', hex: '#00f0ff' },
  { name: 'Plasma Pink', hex: '#ff007f' },
  { name: 'Toxic Lime', hex: '#00ff66' },
  { name: 'Solar Amber', hex: '#ffe600' },
  { name: 'Astral Violet', hex: '#9d00ff' },
  { name: 'Flame Orange', hex: '#ff5500' },
  { name: 'Quantum White', hex: '#ffffff' },
  { name: 'Rainbow Prism', hex: 'rainbow' }
];

const BRUSH_STYLES = [
  { id: 'laser', name: 'Laser', icon: '⚡' },
  { id: 'stardust', name: 'Stardust', icon: '✨' },
  { id: 'fire', name: 'Fire', icon: '🔥' },
  { id: 'ribbon', name: 'Ribbon', icon: '〰️' }
];

const GESTURE_TYPES = {
  DRAWING: 'DRAWING',
  HOVER: 'HOVER',
  ERASER: 'ERASER',
  PAUSE: 'PAUSE',
  CLEAR: 'CLEAR'
};

const CONFIG = {
  defaultColor: '#00f0ff',
  defaultBrushStyle: 'laser',
  defaultBrushSize: 8,
  emaAlpha: 0.35,
  pinchThreshold: 0.05,
  eraserRadius: 45
};

// Computes the exact rendered rectangle of the webcam video on screen (matching object-fit: contain)
function getWebcamViewport() {
  const vid = document.getElementById('webcamVideo');
  const sw = window.innerWidth;
  const sh = window.innerHeight;

  if (!vid || !vid.videoWidth || !vid.videoHeight) {
    return { x: 0, y: 0, w: sw, h: sh, vw: sw, vh: sh };
  }

  const vw = vid.videoWidth;
  const vh = vid.videoHeight;
  const videoAspect = vw / vh;
  const screenAspect = sw / sh;

  let w, h, x, y;
  if (screenAspect > videoAspect) {
    h = sh;
    w = sh * videoAspect;
    x = (sw - w) / 2;
    y = 0;
  } else {
    w = sw;
    h = sw / videoAspect;
    x = 0;
    y = (sh - h) / 2;
  }

  return { x, y, w, h, vw, vh };
}

// 2. AUDIO SYNTHESIZER ENGINE (Web Audio API)
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.drawOsc = null;
    this.drawGain = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.drawGain) {
      this.drawGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return !this.muted;
  }

  startDrawSound() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (!this.drawOsc) {
      this.drawOsc = this.ctx.createOscillator();
      this.drawGain = this.ctx.createGain();

      this.drawOsc.type = 'sine';
      this.drawOsc.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.drawGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.drawGain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 0.08);

      this.drawOsc.connect(this.drawGain);
      this.drawGain.connect(this.ctx.destination);
      this.drawOsc.start();
    }
  }

  updatePitch(velocity) {
    if (this.muted || !this.drawOsc || !this.ctx) return;
    const target = Math.min(750, 300 + velocity * 12);
    this.drawOsc.frequency.setTargetAtTime(target, this.ctx.currentTime, 0.04);
  }

  stopDrawSound() {
    if (this.drawGain && this.ctx) {
      this.drawGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
      setTimeout(() => {
        if (this.drawOsc) {
          try {
            this.drawOsc.stop();
            this.drawOsc.disconnect();
          } catch (e) {}
          this.drawOsc = null;
          this.drawGain = null;
        }
      }, 90);
    }
  }

  playChime(freq = 640) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }

  playZap() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  playTriumph() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.05 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.52);
    });
  }

  playMathTriumph() { this.playTriumph(); }

  playWhoosh() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }
}

const audio = new AudioEngine();

// 3. MULTI-LAYER AIR CANVAS ENGINE
class AirCanvas {
  constructor({ paintCanvas, particleCanvas, cursorHudCanvas }) {
    this.paintCanvas = paintCanvas;
    this.particleCanvas = particleCanvas;
    this.cursorHudCanvas = cursorHudCanvas;

    this.paintCtx = paintCanvas.getContext('2d');
    this.particleCtx = particleCanvas.getContext('2d');
    this.hudCtx = cursorHudCanvas.getContext('2d');

    this.currentColor = CONFIG.defaultColor;
    this.currentBrushStyle = CONFIG.defaultBrushStyle;
    this.currentBrushSize = CONFIG.defaultBrushSize;
    this.rainbowHue = 0;

    this.strokes = [];
    this.redoStack = [];
    this.activeStroke = null;
    this.lastPoint = null;

    this.particles = [];
    this.cursorPos = { x: -100, y: -100 };
    this.cursorGesture = 'HOVER';
    this.handLandmarks = null;
    this.onStrokeUpdate = null;

    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());

    this.renderLoop = this.renderLoop.bind(this);
    requestAnimationFrame(this.renderLoop);
  }

  resizeCanvases() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    [this.paintCanvas, this.particleCanvas, this.cursorHudCanvas].forEach(c => {
      c.width = w;
      c.height = h;
    });

    this.redrawAllStrokes();
  }

  setColor(c) { this.currentColor = c; }
  setBrushStyle(s) { this.currentBrushStyle = s; }
  setBrushSize(sz) { this.currentBrushSize = parseInt(sz, 10) || 8; }

  startStroke(x, y) {
    const color = this.currentColor === 'rainbow' ? `hsl(${this.rainbowHue}, 100%, 55%)` : this.currentColor;
    this.activeStroke = {
      points: [{ x, y }],
      color,
      isRainbow: this.currentColor === 'rainbow',
      brushStyle: this.currentBrushStyle,
      size: this.currentBrushSize,
      timestamp: Date.now()
    };
    this.lastPoint = { x, y };
    this.redoStack = [];
    audio.startDrawSound();
    if (this.onStrokeUpdate) {
      this.onStrokeUpdate({ event: 'start', stroke: this.activeStroke, strokes: this.strokes });
    }
  }

  addPoint(x, y) {
    if (!this.activeStroke || !this.lastPoint) return;

    const dist = Math.hypot(x - this.lastPoint.x, y - this.lastPoint.y);
    if (dist < 1.5) return;

    audio.updatePitch(Math.min(50, dist));

    if (this.activeStroke.isRainbow) {
      this.rainbowHue = (this.rainbowHue + 3) % 360;
      this.activeStroke.color = `hsl(${this.rainbowHue}, 100%, 55%)`;
    }

    this.renderSegment(this.lastPoint, { x, y }, this.activeStroke);
    this.emitParticles(x, y, this.activeStroke);

    this.activeStroke.points.push({ x, y });
    this.lastPoint = { x, y };

    if (this.onStrokeUpdate) {
      this.onStrokeUpdate({ event: 'point', stroke: this.activeStroke, strokes: this.strokes });
    }
  }

  endStroke() {
    let completed = null;
    if (this.activeStroke) {
      if (this.activeStroke.points.length > 0) {
        completed = this.activeStroke;
        this.strokes.push(this.activeStroke);
      }
      this.activeStroke = null;
    }
    this.lastPoint = null;
    audio.stopDrawSound();

    if (this.onStrokeUpdate) {
      this.onStrokeUpdate({ event: 'end', stroke: completed, strokes: this.strokes });
    }
  }

  renderSegment(p1, p2, stroke) {
    const ctx = this.paintCtx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const color = stroke.color;
    const baseSize = stroke.size;

    switch (stroke.brushStyle) {
      case 'laser': {
        ctx.shadowBlur = baseSize * 2.5;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = baseSize;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.shadowBlur = baseSize * 0.8;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = Math.max(1.5, baseSize * 0.35);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        break;
      }
      case 'stardust': {
        ctx.shadowBlur = baseSize * 2;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = baseSize * 0.8;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        break;
      }
      case 'fire': {
        const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, '#ff3300');
        grad.addColorStop(0.6, '#ff9900');
        grad.addColorStop(1, '#ffee55');
        ctx.shadowBlur = baseSize * 2;
        ctx.shadowColor = '#ff5500';
        ctx.strokeStyle = grad;
        ctx.lineWidth = baseSize;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        break;
      }
      case 'ribbon': {
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        ctx.shadowBlur = baseSize * 1.5;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(2, baseSize * (1 + dist * 0.08));
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        break;
      }
      default: {
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = baseSize;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  emitParticles(x, y, stroke) {
    if (stroke.brushStyle === 'stardust') {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 3 + 1.5,
          alpha: 1,
          decay: 0.02,
          color: stroke.color,
          type: 'star'
        });
      }
    } else if (stroke.brushStyle === 'fire') {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -(Math.random() * 2.2 + 0.8),
          size: Math.random() * 4 + 2,
          alpha: 1,
          decay: 0.03,
          color: Math.random() > 0.5 ? '#ffaa00' : '#ff4400',
          type: 'ember'
        });
      }
    }
  }

  eraseAt(x, y) {
    const r = CONFIG.eraserRadius;
    const initial = this.strokes.length;
    this.strokes = this.strokes.filter(s => !s.points.some(p => Math.hypot(p.x - x, p.y - y) <= r));
    if (this.strokes.length !== initial) {
      audio.playZap();
      this.redrawAllStrokes();
      if (this.onStrokeUpdate) this.onStrokeUpdate({ event: 'change', strokes: this.strokes });
    }
  }

  redrawAllStrokes() {
    this.paintCtx.clearRect(0, 0, this.paintCanvas.width, this.paintCanvas.height);
    for (const stroke of this.strokes) {
      for (let i = 1; i < stroke.points.length; i++) {
        this.renderSegment(stroke.points[i - 1], stroke.points[i], stroke);
      }
    }
    if (this.onStrokeUpdate) this.onStrokeUpdate({ event: 'change', strokes: this.strokes });
  }

  undo() {
    if (this.strokes.length > 0) {
      this.redoStack.push(this.strokes.pop());
      this.redrawAllStrokes();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      this.strokes.push(this.redoStack.pop());
      this.redrawAllStrokes();
    }
  }

  clear() {
    for (const stroke of this.strokes) {
      for (let i = 0; i < stroke.points.length; i += 3) {
        const pt = stroke.points[i];
        this.particles.push({
          x: pt.x,
          y: pt.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 3 + 1,
          alpha: 1,
          decay: 0.035,
          color: stroke.color,
          type: 'star'
        });
      }
    }
    this.strokes = [];
    this.redoStack = [];
    this.activeStroke = null;
    this.paintCtx.clearRect(0, 0, this.paintCanvas.width, this.paintCanvas.height);
    audio.playWhoosh();
    if (this.onStrokeUpdate) this.onStrokeUpdate({ event: 'clear', strokes: [] });
  }

  async drawAiStroke(points, color = '#00ff66', style = 'laser', size = 7) {
    if (!points || points.length < 2) return;
    const stroke = { points: [points[0]], color, isRainbow: false, brushStyle: style, size, timestamp: Date.now() };
    audio.startDrawSound();

    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      stroke.points.push(p2);
      this.renderSegment(p1, p2, stroke);
      this.emitParticles(p2.x, p2.y, stroke);
      await new Promise(r => setTimeout(r, 16));
    }
    this.strokes.push(stroke);
    audio.stopDrawSound();
  }

  updateCursor(x, y, gesture, landmarks = null) {
    this.cursorPos = { x, y };
    this.cursorGesture = gesture;
    this.handLandmarks = landmarks;
  }

  renderLoop() {
    this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.particleCtx.save();
      this.particleCtx.globalAlpha = p.alpha;
      this.particleCtx.fillStyle = p.color;
      this.particleCtx.shadowBlur = 6;
      this.particleCtx.shadowColor = p.color;
      this.particleCtx.beginPath();
      this.particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.particleCtx.fill();
      this.particleCtx.restore();
    }

    this.hudCtx.clearRect(0, 0, this.cursorHudCanvas.width, this.cursorHudCanvas.height);
    const { x, y } = this.cursorPos;
    const w = this.cursorHudCanvas.width;
    const h = this.cursorHudCanvas.height;

    if (this.handLandmarks) {
      const lm = this.handLandmarks;
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
      ];

      this.hudCtx.save();
      this.hudCtx.lineWidth = 1.6;
      this.hudCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      this.hudCtx.shadowBlur = 6;
      this.hudCtx.shadowColor = '#00f0ff';

      const vp = getWebcamViewport();
      for (const [start, end] of connections) {
        const p1 = lm[start];
        const p2 = lm[end];
        this.hudCtx.beginPath();
        this.hudCtx.moveTo(vp.x + (1 - p1.x) * vp.w, vp.y + p1.y * vp.h);
        this.hudCtx.lineTo(vp.x + (1 - p2.x) * vp.w, vp.y + p2.y * vp.h);
        this.hudCtx.stroke();
      }

      for (let i = 0; i < lm.length; i++) {
        const pt = lm[i];
        if (i !== 8) {
          this.hudCtx.beginPath();
          this.hudCtx.arc(vp.x + (1 - pt.x) * vp.w, vp.y + pt.y * vp.h, 2.5, 0, Math.PI * 2);
          this.hudCtx.fillStyle = '#00f0ff';
          this.hudCtx.fill();
        }
      }
      this.hudCtx.restore();
    }

    if (x >= 0 && y >= 0) {
      this.hudCtx.save();
      if (this.cursorGesture === 'ERASER') {
        this.hudCtx.strokeStyle = 'rgba(255, 0, 80, 0.85)';
        this.hudCtx.lineWidth = 2;
        this.hudCtx.shadowBlur = 14;
        this.hudCtx.shadowColor = '#ff0055';
        this.hudCtx.beginPath();
        this.hudCtx.arc(x, y, CONFIG.eraserRadius, 0, Math.PI * 2);
        this.hudCtx.stroke();
      } else if (this.cursorGesture === 'DRAWING') {
        const color = this.currentColor === 'rainbow' ? `hsl(${this.rainbowHue}, 100%, 55%)` : this.currentColor;
        this.hudCtx.fillStyle = color;
        this.hudCtx.shadowBlur = 18;
        this.hudCtx.shadowColor = color;
        this.hudCtx.beginPath();
        this.hudCtx.arc(x, y, this.currentBrushSize / 2 + 3, 0, Math.PI * 2);
        this.hudCtx.fill();

        this.hudCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.hudCtx.lineWidth = 1.8;
        this.hudCtx.beginPath();
        this.hudCtx.arc(x, y, 14, 0, Math.PI * 2);
        this.hudCtx.stroke();
      } else {
        this.hudCtx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
        this.hudCtx.lineWidth = 1.4;
        this.hudCtx.setLineDash([3, 3]);
        this.hudCtx.beginPath();
        this.hudCtx.arc(x, y, 15, 0, Math.PI * 2);
        this.hudCtx.stroke();

        this.hudCtx.setLineDash([]);
        this.hudCtx.fillStyle = '#00f0ff';
        this.hudCtx.beginPath();
        this.hudCtx.arc(x, y, 3.5, 0, Math.PI * 2);
        this.hudCtx.fill();
      }
      this.hudCtx.restore();
    }

    if (this.onFrameTick) {
      this.onFrameTick();
    }

    requestAnimationFrame(this.renderLoop);
  }

  exportImage() {
    const video = document.getElementById('webcamVideo');
    const vp = getWebcamViewport();

    // Export dimensions = FULL NATIVE RESOLUTION OF THE WEBCAM (100% uncropped)
    const vw = (video && video.videoWidth) ? video.videoWidth : (vp.vw || 1280);
    const vh = (video && video.videoHeight) ? video.videoHeight : (vp.vh || 720);

    const exp = document.createElement('canvas');
    exp.width = vw;
    exp.height = vh;
    const ctx = exp.getContext('2d');

    // 1. Draw the 100% full uncropped webcam image
    if (video && video.readyState >= 2 && !video.paused) {
      ctx.save();
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, vw, vh);
      ctx.restore();
    } else {
      ctx.fillStyle = '#07080d';
      ctx.fillRect(0, 0, vw, vh);
    }

    // 2. Render all strokes scaled to the full webcam resolution
    const scale = vw / vp.w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of this.strokes) {
      if (!stroke.points || stroke.points.length < 2) continue;
      const color = stroke.color === 'rainbow' ? '#00f0ff' : stroke.color;

      ctx.save();
      ctx.shadowBlur = 10 * scale;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, (stroke.size || 8) * scale);

      ctx.beginPath();
      for (let i = 0; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        const sx = (pt.x - vp.x) * scale;
        const sy = (pt.y - vp.y) * scale;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Core white highlight
      ctx.shadowBlur = 3 * scale;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = Math.max(1, ctx.lineWidth * 0.35);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render active particle trails
    if (this.particles && this.particles.length > 0) {
      for (const p of this.particles) {
        const px = (p.x - vp.x) * scale;
        const py = (p.y - vp.y) * scale;
        if (px >= 0 && px <= vw && py >= 0 && py <= vh) {
          ctx.save();
          ctx.fillStyle = p.color || '#00f0ff';
          ctx.shadowBlur = 6 * scale;
          ctx.shadowColor = p.color || '#00f0ff';
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1, (p.size || 2) * scale), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // 4. Studio branding watermark in bottom corner
    ctx.save();
    const fSize = Math.round(14 * Math.max(1, vw / 1280));
    ctx.font = `700 ${fSize}px Orbitron, sans-serif`;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f0ff';
    ctx.fillText('AETHERSCRIBE AI STUDIO', 24, vh - 20);
    ctx.restore();

    return exp.toDataURL('image/png');
  }
}

// 4. MEDIAPIPE HAND TRACKER (PURE 60 FPS HAND TRACKING)
class HandTracker {
  constructor({ videoElement, onFrameUpdate, onStatusChange }) {
    this.videoElement = videoElement;
    this.onFrameUpdate = onFrameUpdate;
    this.onStatusChange = onStatusChange;

    this.hands = null;
    this.camera = null;
    this.isCameraActive = true;
    this.isCameraMirrored = true;

    this.smoothedX = 0;
    this.smoothedY = 0;
    this.smoothedZ = 0;
    this.hasInitialPos = false;

    this.gestureHistory = [];
    this.lastFrameTime = performance.now();
    this.fps = 60;
  }

  async init() {
    this.onStatusChange({ status: 'initializing', message: 'Starting Camera Feed...' });

    let retries = 0;
    while ((!window.Hands || !window.Camera) && retries < 25) {
      await new Promise(r => setTimeout(r, 200));
      retries++;
    }

    if (!window.Hands) {
      this.onStatusChange({ status: 'error', message: 'MediaPipe loading failed. Mouse mode active.' });
      return false;
    }

    try {
      this.hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
      });

      this.hands.onResults(this.onResults.bind(this));
      await this.startCamera();
      return true;
    } catch (err) {
      console.warn('Webcam permission error:', err);
      this.onStatusChange({ status: 'fallback', message: 'Webcam not accessible. Mouse mode enabled!' });
      return false;
    }
  }

  async startCamera() {
    try {
      if (window.Camera) {
        if (!this.camera) {
          this.camera = new window.Camera(this.videoElement, {
            onFrame: async () => {
              if (this.isCameraActive && this.videoElement.readyState >= 2) {
                if (this.hands) {
                  try { await this.hands.send({ image: this.videoElement }); } catch (e) {}
                }
              }
            },
            width: 1280,
            height: 720
          });
        }

        await this.camera.start();
        this.isCameraActive = true;
        this.videoElement.classList.remove('camera-off');
        this.onStatusChange({ status: 'active', message: 'FULLSCREEN ACTIVE (60 FPS)' });
        return true;
      }
    } catch (e) {
      console.warn('Failed to start camera:', e);
      this.onStatusChange({ status: 'fallback', message: 'Camera permission denied.' });
      return false;
    }
  }

  stopCamera() {
    this.isCameraActive = false;
    this.videoElement.classList.add('camera-off');
    if (this.camera && typeof this.camera.stop === 'function') {
      try { this.camera.stop(); } catch (e) {}
    }
    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
    this.onStatusChange({ status: 'off', message: 'CAMERA OFF (Click to Resume)' });
  }

  toggleCamera() {
    if (this.isCameraActive) {
      this.stopCamera();
      return false;
    } else {
      this.startCamera();
      return true;
    }
  }

  onResults(results) {
    if (!this.isCameraActive) return;

    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (delta > 0) this.fps = Math.round(0.9 * this.fps + 0.1 * (1000 / delta));

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.onFrameUpdate({ detected: false, fps: this.fps, gesture: GESTURE_TYPES.HOVER, landmarks: null });
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const rawGesture = this.classifyGesture(landmarks);
    this.gestureHistory.push(rawGesture);
    if (this.gestureHistory.length > 4) this.gestureHistory.shift();

    const counts = {};
    for (const g of this.gestureHistory) counts[g] = (counts[g] || 0) + 1;
    let stableGesture = rawGesture;
    for (const g in counts) {
      if (counts[g] >= 2) { stableGesture = g; break; }
    }

    const indexTip = landmarks[8];
    const vp = getWebcamViewport();
    const rawX = vp.x + (1 - indexTip.x) * vp.w;
    const rawY = vp.y + indexTip.y * vp.h;
    const rawZ = indexTip.z;

    if (!this.hasInitialPos) {
      this.smoothedX = rawX; this.smoothedY = rawY; this.smoothedZ = rawZ;
      this.hasInitialPos = true;
    } else {
      const a = CONFIG.emaAlpha;
      this.smoothedX = a * rawX + (1 - a) * this.smoothedX;
      this.smoothedY = a * rawY + (1 - a) * this.smoothedY;
      this.smoothedZ = a * rawZ + (1 - a) * this.smoothedZ;
    }

    this.onFrameUpdate({
      detected: true,
      fps: this.fps,
      gesture: stableGesture,
      point: { x: this.smoothedX, y: this.smoothedY, z: this.smoothedZ },
      landmarks
    });
  }

  classifyGesture(lm) {
    const isIndexExtended = lm[8].y < lm[6].y;
    const isMiddleExtended = lm[12].y < lm[10].y;
    const isRingExtended = lm[16].y < lm[14].y;
    const isPinkyExtended = lm[20].y < lm[18].y;

    const pinchDist = Math.hypot(lm[8].x - lm[4].x, lm[8].y - lm[4].y, lm[8].z - lm[4].z);
    const isPinching = pinchDist < CONFIG.pinchThreshold;

    // 1. Two Fingers (Index + Middle extended, Ring and Pinky folded) -> ERASER (Peace V)
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return GESTURE_TYPES.ERASER;
    }

    // 2. Three Fingers (Index + Middle + Ring extended, Pinky folded) -> ERASER
    if (isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended) {
      return GESTURE_TYPES.ERASER;
    }

    // 3. Pinky extended (Shaka or Pinky up) -> CLEAR
    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && isPinkyExtended) {
      return GESTURE_TYPES.CLEAR;
    }

    // 4. Fist (all 4 fingers folded) -> PAUSE
    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return GESTURE_TYPES.PAUSE;
    }

    // 5. One Finger: Index only extended or Pinch -> DRAWING
    if (isPinching || (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended)) {
      return GESTURE_TYPES.DRAWING;
    }

    // 6. Default: Open Palm / All fingers extended -> HOVER
    return GESTURE_TYPES.HOVER;
  }
}

// 5. AI TWIN & HARMONIC SHADOW PEN
class AiCoWriter {
  constructor({ airCanvas }) {
    this.airCanvas = airCanvas;
    this.enabled = true;
    this.phase = 0;
    this.lastTwinPoint = null;
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }

  onStrokeStart(x, y) {
    if (!this.enabled) return;
    this.phase = 0;
    this.lastTwinPoint = { x: x + 15, y: y + 15 };
  }

  onStrokeMove(userX, userY, stroke) {
    if (!this.enabled || !stroke) return;

    this.phase += 0.15;
    const twinX = userX + Math.cos(this.phase) * 12;
    const twinY = userY + Math.sin(this.phase) * 12;

    if (this.lastTwinPoint) {
      const ctx = this.airCanvas.paintCtx;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = stroke.size * 1.8;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = Math.max(1, stroke.size * 0.4);

      ctx.beginPath();
      ctx.moveTo(this.lastTwinPoint.x, this.lastTwinPoint.y);
      ctx.lineTo(twinX, twinY);
      ctx.stroke();
      ctx.restore();

      if (Math.random() > 0.4) {
        this.airCanvas.particles.push({
          x: twinX, y: twinY,
          vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 2.5 + 1, alpha: 0.9, decay: 0.025,
          color: '#ffffff', type: 'star'
        });
      }
    }

    this.lastTwinPoint = { x: twinX, y: twinY };
  }

  onStrokeEnd() { this.lastTwinPoint = null; }
}

// 6. LEFT AIR-WRITING DISPLAY (Visually mirrors writing with Black / Webcam background)
class LeftWritingDisplay {
  constructor({ inkCanvas, airCanvas, videoElement }) {
    this.inkCanvas = inkCanvas;
    this.inkCtx = inkCanvas ? inkCanvas.getContext('2d') : null;
    this.airCanvas = airCanvas;
    this.videoElement = videoElement || document.getElementById('webcamVideo');
    this.badgeEl = document.getElementById('liveWritingBadge');
    this.strokeStatsEl = document.getElementById('inkStrokeStats');
    this.canvasFrameEl = document.getElementById('inkCanvasFrame');

    this.bgMode = 'black'; // 'black' | 'webcam'
    this.isWriting = false;
    this.particles = [];

    this.initControls();
    this.render();
  }

  initControls() {
    const minBtn = document.getElementById('minLeftPanelBtn');
    const body = document.getElementById('leftPanelBody');
    if (minBtn && body) {
      let isMin = false;
      minBtn.addEventListener('click', () => {
        isMin = !isMin;
        body.classList.toggle('hidden', isMin);
        minBtn.textContent = isMin ? '□' : '_';
      });
    }

    // Background Mode Switcher: BLACK vs WEBCAM
    this.bgBlackBtn = document.getElementById('bgBlackBtn');
    this.bgWebcamBtn = document.getElementById('bgWebcamBtn');

    if (this.bgBlackBtn) {
      this.bgBlackBtn.addEventListener('click', () => {
        this.setBgMode('black');
      });
    }

    if (this.bgWebcamBtn) {
      this.bgWebcamBtn.addEventListener('click', () => {
        this.setBgMode('webcam');
      });
    }

    const undoBtn = document.getElementById('undoInkBtn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (this.airCanvas) this.airCanvas.undo();
      });
    }

    const saveBtn = document.getElementById('saveInkBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSnapshot();
      });
    }

    const clearBtn = document.getElementById('clearTextBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (this.airCanvas) this.airCanvas.clear();
        this.clear();
      });
    }

    // Brush Style Selector directly on Left Panel (Laser, Stardust, Fire, Ribbon)
    const leftBrushBtns = document.querySelectorAll('.left-brush-btn');
    leftBrushBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const style = btn.getAttribute('data-style');
        this.setBrushStyle(style);
        if (this.airCanvas) {
          this.airCanvas.setBrushStyle(style);
        }
        audio.playChime(720);
      });
    });
  }

  setBrushStyle(style) {
    const styleObj = BRUSH_STYLES.find(s => s.id === style) || { name: style, icon: '⚡' };

    // Update left panel buttons
    document.querySelectorAll('.left-brush-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-style') === style);
    });

    // Update left panel badges
    const badge = document.getElementById('leftActiveStyleBadge');
    if (badge) badge.textContent = `${styleObj.icon} ${styleObj.name.toUpperCase()}`;
    const statusText = document.getElementById('leftBrushStatusText');
    if (statusText) statusText.textContent = `${styleObj.icon} ${styleObj.name.toUpperCase()}`;

    // Synchronize top station buttons
    document.querySelectorAll('.brush-style-btn').forEach(b => {
      const match = b.textContent.toLowerCase().includes(style);
      b.classList.toggle('active', match);
    });

    this.render();
  }

  setBgMode(mode) {
    if (mode !== 'black' && mode !== 'webcam') return;
    this.bgMode = mode;

    if (this.bgBlackBtn) this.bgBlackBtn.classList.toggle('active', mode === 'black');
    if (this.bgWebcamBtn) this.bgWebcamBtn.classList.toggle('active', mode === 'webcam');
    if (this.canvasFrameEl) this.canvasFrameEl.classList.toggle('webcam-mode', mode === 'webcam');

    audio.playChime(mode === 'webcam' ? 750 : 550);
    this.render();
  }

  // Dedicated high-fidelity stroke renderer matching Fire, Stardust, Ribbon, and Laser
  drawStyledStroke(ctx, stroke, scaleX, scaleY, offsetX = 0, offsetY = 0) {
    if (!stroke || !stroke.points || stroke.points.length < 2) return;

    const brushStyle = stroke.brushStyle || 'laser';
    const color = stroke.color === 'rainbow' ? '#00f0ff' : (stroke.color || '#00f0ff');
    const baseSize = Math.max(2.2, Math.min(6.5, (stroke.size || 8) * scaleX * 1.15));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = {
        x: stroke.points[i].x * scaleX + offsetX,
        y: stroke.points[i].y * scaleY + offsetY
      };
      const p2 = {
        x: stroke.points[i + 1].x * scaleX + offsetX,
        y: stroke.points[i + 1].y * scaleY + offsetY
      };

      switch (brushStyle) {
        case 'fire': {
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          grad.addColorStop(0, '#ff2200');
          grad.addColorStop(0.55, '#ff8800');
          grad.addColorStop(1, '#ffea00');

          ctx.shadowBlur = baseSize * 2.4;
          ctx.shadowColor = '#ff5500';
          ctx.strokeStyle = grad;
          ctx.lineWidth = baseSize * 1.25;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Hot inner white-yellow core
          ctx.shadowBlur = baseSize * 0.6;
          ctx.shadowColor = '#ffffaa';
          ctx.strokeStyle = 'rgba(255, 255, 220, 0.85)';
          ctx.lineWidth = Math.max(1, baseSize * 0.35);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          break;
        }
        case 'stardust': {
          ctx.shadowBlur = baseSize * 2.8;
          ctx.shadowColor = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = baseSize * 0.95;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Stardust center sparkle
          ctx.shadowBlur = baseSize * 1.2;
          ctx.shadowColor = '#ffffff';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = Math.max(1.2, baseSize * 0.38);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          break;
        }
        case 'ribbon': {
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          ctx.shadowBlur = baseSize * 1.6;
          ctx.shadowColor = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1.5, baseSize * (1 + dist * 0.09));
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          break;
        }
        case 'laser':
        default: {
          ctx.shadowBlur = baseSize * 2.0;
          ctx.shadowColor = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = baseSize;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          ctx.shadowBlur = baseSize * 0.8;
          ctx.shadowColor = '#ffffff';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = Math.max(1, baseSize * 0.35);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          break;
        }
      }
    }
    ctx.restore();
  }

  // Unified rendering of background, styled strokes (Fire, Stardust, Laser, Ribbon), and particles
  render(extraStrokes = null, activeStroke = null) {
    if (!this.inkCtx || !this.inkCanvas) return;
    const ctx = this.inkCtx;
    const cw = this.inkCanvas.width;
    const ch = this.inkCanvas.height;

    // Collect all strokes
    const allStrokes = extraStrokes ? [...extraStrokes] : [...(this.airCanvas ? this.airCanvas.strokes : [])];
    const currentActive = activeStroke || (this.airCanvas ? this.airCanvas.activeStroke : null);
    if (currentActive && currentActive.points && currentActive.points.length > 0) {
      allStrokes.push(currentActive);
    }

    // 1. Draw Background
    ctx.clearRect(0, 0, cw, ch);

    if (this.bgMode === 'webcam') {
      const vid = this.videoElement || document.getElementById('webcamVideo');
      if (vid && vid.readyState >= 2 && !vid.paused) {
        ctx.save();
        // Mirror horizontally to match webcam display mirror
        ctx.translate(cw, 0);
        ctx.scale(-1, 1);

        const vw = vid.videoWidth || 640;
        const vh = vid.videoHeight || 480;
        // Cover aspect ratio
        const scale = Math.max(cw / vw, ch / vh);
        const sw = cw / scale;
        const sh = ch / scale;
        const sx = (vw - sw) / 2;
        const sy = (vh - sh) / 2;

        ctx.drawImage(vid, sx, sy, sw, sh, 0, 0, cw, ch);
        ctx.restore();

        // Subtle dark contrast wash
        ctx.fillStyle = 'rgba(2, 6, 18, 0.12)';
        ctx.fillRect(0, 0, cw, ch);
      } else {
        ctx.fillStyle = 'rgba(4, 7, 16, 0.95)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.font = '600 10px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('WEBCAM SYNCING...', cw / 2, ch / 2);
      }
    } else {
      // Pure Cybernetic Black Background
      ctx.fillStyle = 'rgba(4, 7, 16, 0.95)';
      ctx.fillRect(0, 0, cw, ch);

      if (allStrokes.length === 0) {
        ctx.font = '600 11px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AIR WRITING PAD', cw / 2, ch / 2 - 8);
        ctx.font = '400 9.5px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillText('Handwriting appears here live', cw / 2, ch / 2 + 10);
      }
    }

    // 2. Draw Strokes with true Fire, Stardust, Ribbon & Laser styles
    if (allStrokes.length > 0) {
      if (this.bgMode === 'webcam') {
        // Map 1:1 with screen webcam viewport
        const screenW = window.innerWidth || cw;
        const screenH = window.innerHeight || ch;
        const scaleX = cw / screenW;
        const scaleY = ch / screenH;

        for (const stroke of allStrokes) {
          this.drawStyledStroke(ctx, stroke, scaleX, scaleY, 0, 0);
        }

        // Spawn live particles on left canvas during active stroke
        if (currentActive && currentActive.points && currentActive.points.length > 0) {
          const lastPt = currentActive.points[currentActive.points.length - 1];
          const px = lastPt.x * scaleX;
          const py = lastPt.y * scaleY;
          this.emitLeftParticles(px, py, currentActive.brushStyle, currentActive.color);
        }
      } else {
        // Black mode: Auto-fit bounding box centering
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const s of allStrokes) {
          for (const p of s.points) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
          }
        }

        const sw = Math.max(maxX - minX, 40);
        const sh = Math.max(maxY - minY, 40);
        const pad = 18;
        const scale = Math.min((cw - pad * 2) / sw, (ch - pad * 2) / sh);
        const offsetX = (cw - sw * scale) / 2 - minX * scale;
        const offsetY = (ch - sh * scale) / 2 - minY * scale;

        for (const stroke of allStrokes) {
          this.drawStyledStroke(ctx, stroke, scale, scale, offsetX, offsetY);
        }

        // Spawn live particles on left canvas during active stroke
        if (currentActive && currentActive.points && currentActive.points.length > 0) {
          const lastPt = currentActive.points[currentActive.points.length - 1];
          const px = lastPt.x * scale + offsetX;
          const py = lastPt.y * scale + offsetY;
          this.emitLeftParticles(px, py, currentActive.brushStyle, currentActive.color);
        }
      }
    }

    // 3. Draw & Animate Left Canvas Particles (Fire Embers & Stardust Stars)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;

      if (p.type === 'star') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x - p.size, p.y);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.stroke();
      } else {
        // Fire ember
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.strokeStatsEl) {
      this.strokeStatsEl.textContent = `${allStrokes.length} stroke${allStrokes.length === 1 ? '' : 's'}`;
    }
  }

  emitLeftParticles(x, y, style, color) {
    if (style === 'fire') {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(Math.random() * 1.5 + 0.6),
          size: Math.random() * 2.5 + 1.2,
          alpha: 1,
          decay: 0.04,
          color: Math.random() > 0.5 ? '#ffaa00' : '#ff4400',
          type: 'ember'
        });
      }
    } else if (style === 'stardust') {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 2.4 + 1.2,
          alpha: 1,
          decay: 0.03,
          color: color || '#00f0ff',
          type: 'star'
        });
      }
    }
  }

  renderInkStream(strokes, activeStroke = null) {
    this.render(strokes, activeStroke);
  }

  setWritingState(isWriting) {
    this.isWriting = isWriting;
    if (this.badgeEl) {
      if (isWriting) {
        this.badgeEl.textContent = 'WRITING...';
        this.badgeEl.classList.add('writing');
      } else {
        this.badgeEl.textContent = 'READY';
        this.badgeEl.classList.remove('writing');
      }
    }
  }

  clear() {
    this.particles = [];
    this.render([]);
    if (this.strokeStatsEl) this.strokeStatsEl.textContent = '0 strokes';
    if (this.badgeEl) this.badgeEl.textContent = 'CLEARED';
    setTimeout(() => { if (this.badgeEl) this.badgeEl.textContent = 'READY'; }, 1200);
  }

  saveSnapshot() {
    if (!this.inkCanvas) return;
    const a = document.createElement('a');
    a.download = `AetherScribe_${this.bgMode === 'webcam' ? 'Webcam' : 'Writing'}_${Date.now()}.png`;
    a.href = this.inkCanvas.toDataURL('image/png');
    a.click();
    audio.playTriumph();
  }
}

// 8. SHAPE RECOGNIZER (Optional beautifier when SNAP is active)
class ShapeRecognizer {
  constructor({ airCanvas }) {
    this.airCanvas = airCanvas;
    this.enabled = false;
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }

  processLastStroke() {
    if (!this.enabled) return;
    const strokes = this.airCanvas.strokes;
    if (strokes.length === 0) return;

    const s = strokes[strokes.length - 1];
    if (s.points.length < 12) return;

    const pts = s.points;
    const start = pts[0];
    const end = pts[pts.length - 1];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    for (const p of pts) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      sumX += p.x; sumY += p.y;
    }

    const w = maxX - minX, h = maxY - minY;
    const maxDim = Math.max(w, h);
    if (maxDim < 35) return;

    const isClosed = Math.hypot(end.x - start.x, end.y - start.y) < maxDim * 0.4;
    const cx = sumX / pts.length, cy = sumY / pts.length;
    const radiusEst = (w + h) / 4;
    let variance = 0;
    for (const p of pts) variance += Math.abs(Math.hypot(p.x - cx, p.y - cy) - radiusEst);
    const circleScore = (variance / pts.length) / radiusEst;

    if (isClosed && circleScore < 0.22 && Math.abs(w - h) < maxDim * 0.35) {
      strokes.pop();
      const circlePts = [];
      for (let i = 0; i <= 48; i++) {
        const theta = (i / 48) * Math.PI * 2;
        circlePts.push({ x: cx + Math.cos(theta) * radiusEst, y: cy + Math.sin(theta) * radiusEst });
      }
      this.airCanvas.drawAiStroke(circlePts, s.color, s.brushStyle, s.size);
    }
  }
}

// 9. MASTER APPLICATION BOOTSTRAP
class AetherScribeApp {
  constructor() {
    this.isAirDrawing = false;
    this.isMouseDown = false;
    this.lastSnapshotTime = 0;
    this.prevGesture = null;
  }

  async init() {
    console.log('🚀 Bootstrapping AetherScribe AI Fullscreen Studio with Live Left Writing Pad...');

    // Canvases
    this.airCanvas = new AirCanvas({
      paintCanvas: document.getElementById('paintCanvas'),
      particleCanvas: document.getElementById('particleCanvas'),
      cursorHudCanvas: document.getElementById('cursorHudCanvas')
    });

    // Left Live Writing Display (Visual Pad with Black vs Webcam mode)
    this.leftWritingDisplay = new LeftWritingDisplay({
      inkCanvas: document.getElementById('leftInkCanvas'),
      airCanvas: this.airCanvas,
      videoElement: document.getElementById('webcamVideo')
    });

    // Live real-time ink mirroring as user writes in the air
    this.airCanvas.onStrokeUpdate = (data) => {
      this.leftWritingDisplay.render(data.strokes, data.stroke);
    };

    // 60 FPS live frame tick for webcam mode and particle animation mirroring
    this.airCanvas.onFrameTick = () => {
      if (this.leftWritingDisplay) {
        if (this.leftWritingDisplay.bgMode === 'webcam' || this.leftWritingDisplay.particles.length > 0) {
          this.leftWritingDisplay.render();
        }
      }
    };

    this.aiTwin = new AiCoWriter({ airCanvas: this.airCanvas });

    this.shapeRecognizer = new ShapeRecognizer({
      airCanvas: this.airCanvas
    });

    // UI Elements
    this.setupTopBar();
    this.setupHUD();
    this.setupBottomGestureDock();
    this.setupModals();
    this.setupMouseEvents();

    // Start Hand Tracker with Fullscreen Webcam
    this.handTracker = new HandTracker({
      videoElement: document.getElementById('webcamVideo'),
      onFrameUpdate: this.handleTrackingUpdate.bind(this),
      onStatusChange: (s) => {
        const statusEl = document.getElementById('sensorStatus');
        if (statusEl) statusEl.textContent = s.message;
      }
    });

    this.handTracker.init();
  }

  setupTopBar() {
    const palette = document.getElementById('paletteContainer');
    const brushStyles = document.getElementById('brushStylesContainer');
    const customColorInput = document.getElementById('customColorInput');
    const customColorPreview = document.getElementById('customColorPreview');
    const sizeSlider = document.getElementById('brushSizeSlider');
    const sizeVal = document.getElementById('brushSizeVal');

    // CAMERA ON / CAMERA OFF TOGGLE
    const toggleCamBtn = document.getElementById('toggleCamBtn');
    const toggleCamText = document.getElementById('toggleCamText');

    toggleCamBtn.addEventListener('click', () => {
      const isNowOn = this.handTracker.toggleCamera();
      toggleCamBtn.classList.toggle('active', isNowOn);
      toggleCamBtn.classList.toggle('off', !isNowOn);
      toggleCamText.textContent = isNowOn ? 'CAMERA ON' : 'CAMERA OFF';
      audio.playChime(isNowOn ? 800 : 400);
    });

    // Colors at top
    NEON_COLORS.forEach((c, idx) => {
      const sw = document.createElement('div');
      sw.className = `color-swatch ${idx === 0 ? 'active' : ''} ${c.hex === 'rainbow' ? 'rainbow-swatch' : ''}`;
      sw.title = c.name;
      if (c.hex !== 'rainbow') {
        sw.style.backgroundColor = c.hex;
        sw.style.color = c.hex;
      } else {
        sw.style.color = '#00f0ff';
      }

      sw.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        this.airCanvas.setColor(c.hex);
        if (c.hex !== 'rainbow') {
          customColorPreview.style.backgroundColor = c.hex;
          customColorPreview.style.boxShadow = `0 0 10px ${c.hex}`;
        }
        audio.playChime();
      });
      palette.appendChild(sw);
    });

    customColorInput.addEventListener('input', (e) => {
      const hex = e.target.value;
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      this.airCanvas.setColor(hex);
      customColorPreview.style.backgroundColor = hex;
      customColorPreview.style.boxShadow = `0 0 10px ${hex}`;
      audio.playChime();
    });

    // Brush Styles
    BRUSH_STYLES.forEach((style, idx) => {
      const btn = document.createElement('button');
      btn.className = `brush-style-btn ${idx === 0 ? 'active' : ''}`;
      btn.innerHTML = `<span>${style.icon}</span><span>${style.name}</span>`;
      btn.title = style.name;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.brush-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.airCanvas.setBrushStyle(style.id);
        if (this.leftWritingDisplay) {
          this.leftWritingDisplay.setBrushStyle(style.id);
        }
        audio.playChime(720);
      });
      brushStyles.appendChild(btn);
    });

    sizeSlider.addEventListener('input', (e) => {
      sizeVal.textContent = `${e.target.value}px`;
      this.airCanvas.setBrushSize(e.target.value);
    });

    // Action buttons
    const twinBtn = document.getElementById('toggleAiTwinBtn');
    twinBtn.addEventListener('click', () => {
      const on = this.aiTwin.toggle();
      twinBtn.classList.toggle('active', on);
      audio.playChime(on ? 920 : 460);
    });

    const snapBtn = document.getElementById('toggleShapeSnapBtn');
    snapBtn.addEventListener('click', () => {
      const on = this.shapeRecognizer.toggle();
      snapBtn.classList.toggle('active', on);
      audio.playChime(on ? 800 : 400);
    });

    document.getElementById('undoBtn').addEventListener('click', () => this.airCanvas.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.airCanvas.redo());
    document.getElementById('clearCanvasBtn').addEventListener('click', () => {
      this.airCanvas.clear();
      this.transcribedBuffer = "";
      this.liveTranscribedText.innerHTML = '<span class="placeholder-text">Draw in air to transcribe...</span>';
    });

    document.getElementById('saveCanvasBtn').addEventListener('click', () => {
      const url = this.airCanvas.exportImage();
      const a = document.createElement('a');
      a.download = `AetherScribe_${Date.now()}.png`;
      a.href = url;
      a.click();
    });

    // Zen / Full View Mode Toggle
    const zenBtn = document.getElementById('toggleZenBtn');
    if (zenBtn) {
      zenBtn.addEventListener('click', () => {
        document.body.classList.toggle('zen-mode');
        const isZen = document.body.classList.contains('zen-mode');
        zenBtn.classList.toggle('active', isZen);
        audio.playChime(isZen ? 720 : 520);
      });
    }

    const audioBtn = document.getElementById('toggleAudioBtn');
    audioBtn.addEventListener('click', () => {
      const unmuted = audio.toggleMute();
      audioBtn.classList.toggle('active', unmuted);
      document.querySelector('.audio-on-icon').classList.toggle('hidden', !unmuted);
      document.querySelector('.audio-off-icon').classList.toggle('hidden', unmuted);
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.airCanvas.undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); this.airCanvas.redo(); }
    });
  }

  setupHUD() {
    this.gestureIcon = document.getElementById('gestureIcon');
    this.gestureName = document.getElementById('gestureName');
    this.hudFps = document.getElementById('hudFps');
    this.hudCoords = document.getElementById('hudCoords');

    this.labels = {
      DRAWING: { icon: '☝️', name: 'DRAWING (1 FINGER)', color: '#00f0ff' },
      HOVER: { icon: '🖐️', name: 'HOVER (OPEN PALM)', color: '#8a99b5' },
      ERASER: { icon: '✌️', name: 'AIR ERASER (PEACE V)', color: '#ff007f' },
      PAUSE: { icon: '✊', name: 'PAUSED (FIST)', color: '#ffe600' },
      CLEAR: { icon: '🤙', name: 'CANVAS DISINTEGRATE', color: '#ff5500' }
    };
  }

  setupBottomGestureDock() {
    this.bottomCards = {
      DRAWING: document.getElementById('cardDraw'),
      HOVER: document.getElementById('cardHover'),
      ERASER: document.getElementById('cardEraser'),
      PAUSE: document.getElementById('cardPause'),
      CLEAR: document.getElementById('cardClear')
    };

    if (this.bottomCards.CLEAR) {
      this.bottomCards.CLEAR.addEventListener('click', () => this.airCanvas.clear());
    }
    if (this.bottomCards.ERASER) {
      this.bottomCards.ERASER.addEventListener('click', () => audio.playZap());
    }
  }

  updateBottomDockHighlight(activeGesture) {
    if (!this.bottomCards) return;

    for (const [key, card] of Object.entries(this.bottomCards)) {
      if (!card) continue;
      if (key === activeGesture) {
        card.classList.add('active-gesture');
        if (key === 'ERASER') card.classList.add('eraser');
        else if (key === 'PAUSE') card.classList.add('pause');
        else if (key === 'CLEAR') card.classList.add('clear');
      } else {
        card.classList.remove('active-gesture', 'eraser', 'pause', 'clear');
      }
    }
  }

  setupModals() {
    const guideModal = document.getElementById('guideModal');
    const visionModal = document.getElementById('visionModal');
    const galleryModal = document.getElementById('galleryModal');

    document.getElementById('helpGuideBtn').addEventListener('click', () => guideModal.classList.remove('hidden'));
    document.getElementById('closeGuideBtn').addEventListener('click', () => guideModal.classList.add('hidden'));
    document.getElementById('dismissGuideBtn').addEventListener('click', () => guideModal.classList.add('hidden'));

    // AI Vision
    document.getElementById('aiInspectBtn').addEventListener('click', async () => {
      visionModal.classList.remove('hidden');
      const dataUrl = this.airCanvas.exportImage();
      document.getElementById('visionSnapshotImg').src = dataUrl;
      document.getElementById('visionStrokesCount').textContent = `${this.airCanvas.strokes.length} strokes`;
      document.getElementById('visionBrushStyle').textContent = this.airCanvas.currentBrushStyle.toUpperCase();

      document.getElementById('visionArtworkTitle').textContent = 'Neural Analysis Loading...';
      document.getElementById('visionRecognized').textContent = 'Scanning spatial vectors...';
      document.getElementById('visionCritique').textContent = 'Analyzing stroke energy...';
      document.getElementById('visionSuggestion').textContent = 'Synthesizing aesthetic advice...';

      try {
        const res = await fetch('/api/ai/analyze-drawing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: dataUrl })
        });
        const data = await res.json();
        document.getElementById('visionArtworkTitle').textContent = data.title;
        document.getElementById('visionRecognized').textContent = data.recognized;
        document.getElementById('visionCritique').textContent = data.critique;
        document.getElementById('visionSuggestion').textContent = data.suggestion;
      } catch (e) {
        document.getElementById('visionArtworkTitle').textContent = 'Aetherial Vector Glyph';
        document.getElementById('visionRecognized').textContent = 'Dynamic Neon Air Vector';
        document.getElementById('visionCritique').textContent = 'Vibrant luminous strokes and smooth kinetic curvature.';
        document.getElementById('visionSuggestion').textContent = 'Add concentric glowing orbits with Cosmic Stardust.';
      }
    });

    document.getElementById('closeVisionBtn').addEventListener('click', () => visionModal.classList.add('hidden'));
    document.getElementById('saveFromVisionBtn').addEventListener('click', async () => {
      const dataUrl = this.airCanvas.exportImage();
      const title = document.getElementById('visionArtworkTitle').textContent;
      try {
        await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title, imageBase64: dataUrl,
            strokeCount: this.airCanvas.strokes.length,
            brushStyle: this.airCanvas.currentBrushStyle,
            dominantColor: this.airCanvas.currentColor
          })
        });
        const btn = document.getElementById('saveFromVisionBtn');
        btn.textContent = '✓ SAVED TO GALLERY!';
        setTimeout(() => { btn.textContent = 'SAVE TO GALLERY'; }, 2000);
        audio.playTriumph();
      } catch (e) {}
    });

    // Gallery
    document.getElementById('galleryBtn').addEventListener('click', async () => {
      galleryModal.classList.remove('hidden');
      const grid = document.getElementById('galleryGrid');
      grid.innerHTML = '<div class="gallery-empty">Retrieving holographic archives...</div>';
      try {
        const res = await fetch('/api/gallery');
        const data = await res.json();
        if (data.drawings && data.drawings.length > 0) {
          grid.innerHTML = '';
          data.drawings.forEach(d => {
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.innerHTML = `
              <img src="${d.imageBase64}" class="gallery-thumb" alt="${d.title}">
              <div class="gallery-info">
                <div class="gallery-title">${d.title}</div>
                <div class="gallery-date">${d.strokeCount || 0} strokes</div>
                <div class="gallery-actions">
                  <button class="gallery-btn dl-btn">Download</button>
                </div>
              </div>
            `;
            card.querySelector('.dl-btn').addEventListener('click', () => {
              const a = document.createElement('a');
              a.download = `${d.title}.png`;
              a.href = d.imageBase64;
              a.click();
            });
            grid.appendChild(card);
          });
        } else {
          grid.innerHTML = '<div class="gallery-empty"><p>No air-drawings saved yet!</p></div>';
        }
      } catch (e) {
        grid.innerHTML = '<div class="gallery-empty"><p>Gallery service offline</p></div>';
      }
    });

    document.getElementById('closeGalleryBtn').addEventListener('click', () => galleryModal.classList.add('hidden'));
    document.getElementById('closeGalleryFooterBtn').addEventListener('click', () => galleryModal.classList.add('hidden'));

    [guideModal, visionModal, galleryModal].forEach(m => {
      m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
    });
  }

  setupMouseEvents() {
    const vp = document.getElementById('canvasViewport');

    vp.addEventListener('mousedown', (e) => {
      audio.ensureContext();
      if (e.button === 2) {
        this.airCanvas.eraseAt(e.clientX, e.clientY);
        this.airCanvas.updateCursor(e.clientX, e.clientY, GESTURE_TYPES.ERASER);
        this.updateBottomDockHighlight(GESTURE_TYPES.ERASER);
        return;
      }
      this.isMouseDown = true;
      this.airCanvas.startStroke(e.clientX, e.clientY);
      this.aiTwin.onStrokeStart(e.clientX, e.clientY);
      this.airCanvas.updateCursor(e.clientX, e.clientY, GESTURE_TYPES.DRAWING);
      this.updateHudStats(60, GESTURE_TYPES.DRAWING, { x: e.clientX, y: e.clientY, z: 0 }, true);
      this.updateBottomDockHighlight(GESTURE_TYPES.DRAWING);
      this.leftWritingDisplay.setWritingState(true);
    });

    vp.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        this.airCanvas.addPoint(e.clientX, e.clientY);
        this.aiTwin.onStrokeMove(e.clientX, e.clientY, this.airCanvas.activeStroke);
        this.airCanvas.updateCursor(e.clientX, e.clientY, GESTURE_TYPES.DRAWING);
        this.updateHudStats(60, GESTURE_TYPES.DRAWING, { x: e.clientX, y: e.clientY, z: 0 }, true);
        this.updateBottomDockHighlight(GESTURE_TYPES.DRAWING);
      } else {
        this.airCanvas.updateCursor(e.clientX, e.clientY, GESTURE_TYPES.HOVER);
        this.updateHudStats(60, GESTURE_TYPES.HOVER, { x: e.clientX, y: e.clientY, z: 0 }, true);
        this.updateBottomDockHighlight(GESTURE_TYPES.HOVER);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        this.airCanvas.endStroke();
        this.aiTwin.onStrokeEnd();
        this.leftWritingDisplay.setWritingState(false);
        if (this.shapeRecognizer && this.shapeRecognizer.enabled) {
          this.shapeRecognizer.processLastStroke();
        }
      }
    });

    vp.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleTrackingUpdate({ detected, fps, gesture, point, landmarks }) {
    this.updateHudStats(fps, gesture, point, detected);
    this.updateBottomDockHighlight(detected ? gesture : null);

    if (!detected || !point) {
      if (this.isAirDrawing) {
        this.airCanvas.endStroke();
        this.aiTwin.onStrokeEnd();
        this.leftWritingDisplay.setWritingState(false);
        if (this.shapeRecognizer && this.shapeRecognizer.enabled) {
          this.shapeRecognizer.processLastStroke();
        }
        this.isAirDrawing = false;
      }
      this.airCanvas.updateCursor(-100, -100, GESTURE_TYPES.HOVER, null);
      return;
    }

    const { x, y } = point;
    this.airCanvas.updateCursor(x, y, gesture, landmarks);

    switch (gesture) {
      case GESTURE_TYPES.DRAWING: {
        if (!this.isAirDrawing) {
          this.airCanvas.startStroke(x, y);
          this.aiTwin.onStrokeStart(x, y);
          this.isAirDrawing = true;
          this.leftWritingDisplay.setWritingState(true);
        } else {
          this.airCanvas.addPoint(x, y);
          this.aiTwin.onStrokeMove(x, y, this.airCanvas.activeStroke);
        }
        break;
      }
      case GESTURE_TYPES.ERASER: {
        if (this.isAirDrawing) {
          this.airCanvas.endStroke();
          this.aiTwin.onStrokeEnd();
          this.leftWritingDisplay.setWritingState(false);
          if (this.shapeRecognizer && this.shapeRecognizer.enabled) {
            this.shapeRecognizer.processLastStroke();
          }
          this.isAirDrawing = false;
        }
        this.airCanvas.eraseAt(x, y);
        break;
      }
      case GESTURE_TYPES.CLEAR: {
        if (this.isAirDrawing) {
          this.airCanvas.endStroke();
          this.aiTwin.onStrokeEnd();
          this.isAirDrawing = false;
        }
        this.airCanvas.clear();
        this.leftWritingDisplay.clear();
        break;
      }
      default: {
        if (this.isAirDrawing) {
          this.airCanvas.endStroke();
          this.aiTwin.onStrokeEnd();
          this.leftWritingDisplay.setWritingState(false);
          if (this.shapeRecognizer && this.shapeRecognizer.enabled) {
            this.shapeRecognizer.processLastStroke();
          }
          this.isAirDrawing = false;
        }
        break;
      }
    }

    this.prevGesture = gesture;
  }

  updateHudStats(fps, gesture, point, detected) {
    if (this.hudFps && fps !== undefined) this.hudFps.textContent = fps;
    if (point && this.hudCoords) this.hudCoords.textContent = `X: ${Math.round(point.x)} Y: ${Math.round(point.y)}`;

    if (gesture && this.labels[gesture]) {
      const g = this.labels[gesture];
      this.gestureIcon.textContent = g.icon;
      this.gestureName.textContent = g.name;
      this.gestureName.style.color = g.color;
    } else if (!detected) {
      this.gestureIcon.textContent = '🖐️';
      this.gestureName.textContent = 'SEARCHING HAND...';
      this.gestureName.style.color = '#53627c';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new AetherScribeApp();
  app.init();
});
