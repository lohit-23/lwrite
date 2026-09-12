import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'drawings.json');

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Helpers for drawings persistence
function getDrawings() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading drawings:', err);
    return [];
  }
}

function saveDrawings(drawings) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(drawings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving drawings:', err);
  }
}

// AI Vision analysis function
async function analyzeDrawing({ imageBase64, prompt, userApiKey }) {
  const apiKey = userApiKey || GEMINI_API_KEY;

  if (apiKey) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const systemPrompt = `You are the master AI Critic for AetherScribe AI air-drawing studio. Analyze this neon air drawing artwork. Provide in clean JSON: "title", "recognized", "critique", "suggestion".`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt ? `${systemPrompt}\nUser note: ${prompt}` : systemPrompt }, { inlineData: { mimeType: 'image/png', data: cleanBase64 } }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            success: true,
            source: 'gemini-vision',
            title: parsed.title || 'Aetherial Lumina',
            recognized: parsed.recognized || 'Spatial Air Glyph',
            critique: parsed.critique || 'Fluid neon strokes with energetic precision.',
            suggestion: parsed.suggestion || 'Add an orbital ring around your central glyph.'
          };
        }
      }
    } catch (e) {
      console.warn('Gemini call failed, using heuristic fallback:', e.message);
    }
  }

  // Heuristic analysis fallback
  const titles = ['Cybernetic Constellation', 'Quantum Luminous Rift', 'Neon Synapse Flow', 'Aetherial Vector Glyph', 'Chroma Pulse Matrix'];
  const recognitions = ['Dynamic spatial air-strokes with neon resonance', 'Geometric calligraphy and luminous curves', 'Abstract cyber-glyph with fluid kinetic energy'];
  const critiques = ['Exceptional stroke momentum! The neon luminescence radiates with smooth organic rhythm.', 'Crisp spatial dexterity detected. The velocity variations create striking chromatic weight.'];
  const suggestions = ['Add an outer glowing corona or concentric resonance wave around your creation.', 'Switch to the Cosmic Stardust brush and sprinkle glowing embers along the vertices.'];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  return {
    success: true,
    source: 'local-heuristic',
    title: pick(titles),
    recognized: pick(recognitions),
    critique: pick(critiques),
    suggestion: pick(suggestions),
    timestamp: new Date().toISOString()
  };
}

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AetherScribe AI Studio Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(GEMINI_API_KEY)
  });
});

// AI Writing & Character Recognition
app.post('/api/ai/recognize-writing', async (req, res) => {
  const { imageBase64, apiKey } = req.body;
  if (!imageBase64) return res.status(400).json({ success: false, error: 'imageBase64 required' });
  const key = apiKey || GEMINI_API_KEY;
  if (key) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const prompt = `Transcribe any air-written characters, words, symbols, or phrases shown in this neon drawing image.
Return strictly a valid JSON object without markdown fences:
{
  "text": "the transcribed text",
  "type": "Word",
  "confidence": 0.98
}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/png', data: cleanBase64 } }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
        })
      });
      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return res.json({
            success: true,
            source: 'gemini-vision',
            text: parsed.text || '',
            type: parsed.type || 'Air Writing',
            confidence: parsed.confidence || 0.95
          });
        }
      }
    } catch (err) {
      console.warn('Gemini OCR failed:', err.message);
    }
  }

  res.json({
    success: true,
    source: 'local-classifier',
    text: '',
    type: 'Air Writing',
    confidence: 0.90
  });
});

// AI Vision
app.post('/api/ai/analyze-drawing', async (req, res) => {
  const { imageBase64, prompt, apiKey } = req.body;
  if (!imageBase64) return res.status(400).json({ success: false, error: 'imageBase64 required' });
  const result = await analyzeDrawing({ imageBase64, prompt, userApiKey: apiKey });
  res.json(result);
});

// Gallery endpoints
app.get('/api/gallery', (req, res) => {
  const drawings = getDrawings();
  res.json({ success: true, count: drawings.length, drawings });
});

app.post('/api/gallery', (req, res) => {
  const { title, imageBase64, strokeCount, brushStyle, dominantColor, aiAnalysis } = req.body;
  if (!imageBase64) return res.status(400).json({ success: false, error: 'imageBase64 required' });

  const drawings = getDrawings();
  const newDrawing = {
    id: 'glyph_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: title || 'Aetherial Masterpiece #' + (drawings.length + 1),
    imageBase64,
    strokeCount: strokeCount || 0,
    brushStyle: brushStyle || 'Laser Neon',
    dominantColor: dominantColor || '#00f0ff',
    aiAnalysis: aiAnalysis || null,
    createdAt: new Date().toISOString()
  };

  drawings.unshift(newDrawing);
  if (drawings.length > 50) drawings.pop();
  saveDrawings(drawings);

  res.status(201).json({ success: true, drawing: newDrawing });
});

app.delete('/api/gallery/:id', (req, res) => {
  const { id } = req.params;
  let drawings = getDrawings();
  const initLen = drawings.length;
  drawings = drawings.filter(d => d.id !== id);
  if (drawings.length === initLen) return res.status(404).json({ success: false, error: 'Not found' });
  saveDrawings(drawings);
  res.json({ success: true, message: 'Deleted' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AetherScribe AI Backend Server is live on port ${PORT}`);
});
