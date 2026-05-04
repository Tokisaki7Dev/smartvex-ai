import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
const OUTPUT_DIR = process.env.NODE_ENV === 'production' ? '/tmp/outputs' : path.join(process.cwd(), 'outputs');

// Ensure directories
[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Middleware
app.use(express.json());
app.use('/outputs', express.static(OUTPUT_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB 
});

// Nexus Adaptive Thread Detection (Optimized for 1 vCPU)
const getOptimalThreads = () => {
  const cpuCount = os.cpus().length;
  // Even with 1 vCPU, we might want to allow 1-2 threads for concurrent IO/Encoding
  // but strictly 1 thread is safer for CPU quotas
  return Math.min(2, cpuCount);
};

// API: Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Nexus Engine v2.0 Adaptive',
    nodes: 1,
    resources: {
        cpu: '1 vCPU',
        memory: '2GB RAM'
    },
    active_threads: getOptimalThreads()
  });
});

// API: Upload
app.post('/api/v1/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const { tool = 'Clipping', settings = '{}' } = req.body;
  const jobId = Math.random().toString(36).substring(7);
  const inputPath = req.file.path;
  const outputFilename = `nexus_${jobId}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  res.json({ jobId, status: 'queued' });

  const threads = getOptimalThreads();
  const command = ffmpeg(inputPath)
    .outputOptions([`-threads ${threads}`, '-preset superfast']); // Faster preset for low resource environments

  // Adaptive Pipeline Logic (from OpusClip features)
  switch (tool) {
    case 'Clipping':
      command.duration(30).videoFilters(['crop=ih*9/16:ih:iw/2-ih*9/32:0']); 
      break;
    case 'Captioning':
      command.videoFilters([
        'drawtext=text="[CAPTION]":x=(w-text_w)/2:y=h-th-80:fontsize=48:fontcolor=white:box=1:boxcolor=pink@0.5'
      ]);
      break;
    case 'BRoll':
      command.videoFilters(['noise=alls=10:allf=t+u']); 
      break;
    case 'Voiceover':
      command.audioFilters(['volume=1.2']);
      break;
    case 'Cleaning':
      command.audioFilters(['afftdn', 'highpass=f=100']);
      break;
    case 'Reframe':
      command.videoFilters(['scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280']);
      break;
    default:
      command.duration(5); // Fallback
      break;
  }

  command
    .on('start', (cmd) => {
      console.log('NEXUS CORE EXEC:', cmd);
      io.emit('jobUpdate', { id: jobId, status: 'processing', progress: 2 });
    })
    .on('progress', (p) => io.emit('jobUpdate', { id: jobId, progress: Math.min(99, Math.floor(p.percent || 0)), status: 'processing' }))
    .on('error', (err) => {
      console.error('NEXUS CRITICAL ERROR:', err);
      io.emit('jobUpdate', { id: jobId, status: 'failed', error: err.message });
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    })
    .on('end', () => {
      io.emit('jobUpdate', { id: jobId, status: 'completed', progress: 100, outputUrl: `/outputs/${outputFilename}` });
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    })
    .save(outputPath);
});

async function startServer() {
  await nextApp.prepare();
  app.all('*', (req, res) => handle(req, res));
  
  httpServer.listen(PORT, '0.0.0.0' as any, () => {
    console.log(`Nexus Adaptive Engine Active on Port ${PORT}`);
    console.log(`Resources Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
