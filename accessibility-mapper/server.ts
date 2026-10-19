import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import { apiRouter } from './server/routes/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Mount REST API Router
app.use('/api', apiRouter);

let yoloProcess: ChildProcess | null = null;

// Function to check if YOLO service is already active on port 8000
function checkMicroserviceOnline(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8000/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startYoloServiceIfNeeded() {
  const isOnline = await checkMicroserviceOnline();
  if (isOnline) {
    console.log('⚡ YOLOv8 best.pt microservice is already active on http://127.0.0.1:8000');
    return;
  }

  const scriptPath = path.resolve(__dirname, 'server/ml/yolo_service.py');
  try {
    yoloProcess = spawn('python', [scriptPath], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    yoloProcess.stdout?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.log(`[YOLO Service] ${msg}`);
    });

    yoloProcess.stderr?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg && !msg.includes('INFO:') && !msg.includes('DEBUG:')) {
        console.warn(`[YOLO Service] ${msg}`);
      }
    });

    yoloProcess.on('exit', (code) => {
      if (code && code !== 0) {
        console.warn(`[YOLO Service] Exited with code ${code}`);
      }
      yoloProcess = null;
    });

    console.log('🚀 Background YOLOv8 best.pt microservice launching on http://127.0.0.1:8000...');
  } catch (err) {
    console.warn('Could not launch background YOLO microservice automatically:', err);
  }
}

// Clean up child process on exit
function cleanup() {
  if (yoloProcess) {
    try {
      yoloProcess.kill();
    } catch {}
    yoloProcess = null;
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', () => { cleanup(); });

async function startServer() {
  // Launch YOLO service in background
  startYoloServiceIfNeeded().catch(console.error);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const portNumber = Number(PORT);
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`Accessibility Mapper & ML Backend active at http://0.0.0.0:${portNumber}`);
  });
}

startServer();
