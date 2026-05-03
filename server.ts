import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import { createServer as createViteServer } from 'vite';

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const PORT = 3000;
const UPLOAD_DIR = '/tmp/smartvex/uploads';
const OUTPUT_DIR = '/tmp/smartvex/outputs';

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

// Xeon Optimized Thread Detection
const getOptimalThreads = () => {
  const cpuCount = os.cpus().length;
  return Math.max(1, cpuCount - 1);
};

// API: Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Xeon v4.2 Gold Cluster',
    nodes: 1,
    active_threads: getOptimalThreads()
  });
});

// API: Upload
app.post('/api/v1/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const { tool = 'Enhancer', settings = '{}' } = req.body;
  const jobId = Math.random().toString(36).substring(7);
  const inputPath = req.file.path;
  const outputFilename = `smartvex_${jobId}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  res.json({ jobId, status: 'queued' });

  const threads = getOptimalThreads();
  const command = ffmpeg(inputPath)
    .outputOptions([`-threads ${threads}`, '-preset faster']);

  // Lógica de Processamento por Ferramenta
  switch (tool) {
    case 'Enhancer':
      command.videoFilters([
        'unsharp=3:3:1.5:3:3:0.5',
        'hqdn3d=2:1:3:2',
        'eq=contrast=1.1:brightness=0.02'
      ]);
      break;
    case 'Compression':
      command.videoCodec('libx264').addOptions(['-crf 28', '-b:v 2M']);
      break;
    case 'Audio':
      command.audioFilters(['afftdn', 'aecho=0.8:0.88:6:0.4', 'loudnorm']);
      break;
    case 'Clipping':
      // Exemplo de corte (primeiros 30 segundos para demo)
      command.duration(30);
      break;
    case 'Conversion':
      // Força container mp4 otimizado para web
      command.format('mp4').videoCodec('libx264');
      break;
    case 'Subtitles':
      // Placeholder: Desenha um texto na base do vídeo simulando sincronia
      command.videoFilters([
        'drawtext=text="[AI GENERATED SUBTITLE]":x=(w-text_w)/2:y=h-th-20:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5'
      ]);
      break;
  }

  command
    .on('start', (cmd) => {
      console.log('FFMPEG CMD:', cmd);
      io.emit('jobUpdate', { id: jobId, status: 'processing', progress: 5 });
    })
    .on('progress', (p) => io.emit('jobUpdate', { id: jobId, progress: Math.floor(p.percent || 0), status: 'processing' }))
    .on('error', (err) => {
      io.emit('jobUpdate', { id: jobId, status: 'failed', error: err.message });
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    })
    .on('end', () => {
      io.emit('jobUpdate', { id: jobId, status: 'completed', progress: 100, url: `/outputs/${outputFilename}` });
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    })
    .save(outputPath);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  httpServer.listen(PORT, '0.0.0.0', () => console.log('SmartVex Node Active'));
}

startServer();
