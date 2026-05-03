import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server as SocketServer } from 'socket.io';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure ffmpeg path
if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

async function startServer() {
  const app = express();
  app.use(cors());
  const httpServer = createHttpServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;
  // Use /tmp for uploads and outputs to guarantee write access in container
  const UPLOAD_DIR = '/tmp/uploads';
  const OUTPUT_DIR = '/tmp/outputs';

  // Request Logging
  app.use((req, res, next) => {
    console.log(`[ENGINE_REQ] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '1024mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1024mb' }));

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  });
  const upload = multer({ storage, limits: { fileSize: 1100 * 1024 * 1024 } }); // 1.1GB limit

  // API Routes - Health check FIRST
  app.get('/ping', (req, res) => res.send('pong'));
  
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      engine: 'Xeon v4.2', 
      time: new Date().toISOString(),
      limits: {
        upload: '1GB'
      }
    });
  });

  app.post('/api/v1/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      
      const { tool, settings } = req.body;
      const parsedSettings = settings ? JSON.parse(settings) : {};
      const jobId = Math.random().toString(36).substring(7);
      const inputPath = req.file.path;
      const outputFilename = `smartvex_${jobId}_${req.file.originalname.split('.')[0]}.mp4`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);

      res.json({ jobId, status: 'queued', filename: req.file.originalname });

      // Background Process
      setTimeout(() => processVideo(jobId, inputPath, outputPath, tool, parsedSettings, io), 500);
    } catch (err: any) {
      console.error('[UPLOAD_ERROR]', err);
      res.status(500).json({ error: `Erro interno no processamento: ${err.message}` });
    }
  });

  app.get('/api/v1/download/:jobId', (req, res) => {
    try {
      const { jobId } = req.params;
      const files = fs.readdirSync(OUTPUT_DIR);
      const targetFile = files.find(f => f.includes(jobId));
      
      if (targetFile) {
        res.download(path.join(OUTPUT_DIR, targetFile));
      } else {
        res.status(404).json({ error: 'Arquivo não encontrado no cluster.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Erro ao acessar o sistema de arquivos.' });
    }
  });

  // Catch unmatched API routes to prevent them falling through to Vite
  app.all('/api/*', (req, res) => {
    console.warn(`[API_404] ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: 'API Endpoint not found on Xeon cluster.',
      path: req.url,
      method: req.method
    });
  });

  // Global Error Handler for API
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[GLOBAL_ERROR]', err);
    res.status(500).json({ 
      error: 'Erro crítico na Engine Xeon.',
      details: err.message
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[35m[SMARTVEX XEON]\x1b[0m Engine v4.2 ativa em http://0.0.0.0:${PORT}`);
  });
  httpServer.timeout = 300000; // 5 minutes
}

function processVideo(jobId: string, input: string, output: string, tool: string, settings: any, io: SocketServer) {
  const socketId = `job:${jobId}:status`;
  
  let command = ffmpeg(input);

  // CPU Optimization for Xeon (AVX-512 / Multi-Threading)
  command = command.addOptions([
    '-threads 0',               // Auto-detect all Xeon cores
    '-preset superfast',        // Speed is priority for SaaS feel
    '-movflags +faststart',     // Fast web playback
    '-pix_fmt yuv420p',         // Universal compatibility
    '-sn',                      // Strip subtitles for speed
    '-dn'                       // Strip data streams
  ]);

  switch (tool) {
    case 'Clipping':
      // Smart Reframe (Centering and 9:16 Scale)
      const ratio = settings.ratio === '1:1 (Insta)' ? 'in_h:in_h' : 'in_h*9/16:in_h';
      command.videoFilters([
        `crop=${ratio}`,
        'scale=1080:1920:force_original_aspect_ratio=increase',
        'crop=1080:1920'
      ]);
      break;
    
    case 'Compression':
      const crf = settings.preset === 'Ultra High' ? '18' : (settings.preset === 'Small Size' ? '32' : '26');
      const codec = settings.codec === 'H.265 (HEVC)' ? 'libx265' : 'libx264';
      command.videoCodec(codec)
        .addOption('-crf', crf)
        .addOption('-tune', 'film');
      break;
    
    case 'Enhancer':
      // High-End CPU Enhancement Chain
      const scale = settings.scale === '4x (4K)' ? '3840:2160' : '1920:1080';
      const sharpen = (settings.sharpen || 50) / 100;
      command.videoFilters([
        `scale=${scale}:flags=lanczos`,
        `unsharp=5:5:${sharpen}:5:5:0.0`, // Technical sharpening
        'hqdn3d=1.5:1.5:6:6',              // High quality denoise
        'cas=0.5'                          // Contrast Adaptive Sharpen (if available)
      ]).videoCodec('libx264');
      break;
    
    case 'AudioCleaning':
      // Professional Audio Mastering Chain
      command.audioFilters([
        'afftdn=nf=-25',    // FFT Denoise
        'anlmdn',           // Non-local means denoise
        'highpass=f=80',    // Remove low hum
        'lowpass=f=15000',  // Remove high hiss
        'loudnorm'          // EBU R128 Normalization
      ]);
      break;
    
    case 'Captioning':
      // Simulated captioning via stylized watermark (Pro style)
      command.videoFilters('drawtext=text="PRO_RENDER_XEON":fontcolor=white@0.8:fontsize=28:x=w-tw-40:y=h-th-40:shadowcolor=black:shadowx=2:shadowy=2');
      break;
  }

  command
    .on('start', (cmdLine) => {
      console.log(`[FFMPEG START] ${jobId}: ${cmdLine}`);
      io.emit(socketId, { status: 'processing', progress: 5 });
    })
    .on('progress', (progress) => {
      io.emit(socketId, { 
        status: 'processing', 
        progress: Math.min(99, Math.floor(progress.percent || 0)) 
      });
    })
    .on('error', (err) => {
      console.error(`[FFMPEG ERROR] ${jobId}:`, err.message);
      io.emit(socketId, { status: 'failed', error: err.message });
      if (fs.existsSync(input)) fs.unlinkSync(input);
    })
    .on('end', () => {
      console.log(`[FFMPEG DONE] ${jobId}`);
      io.emit(socketId, { status: 'completed', progress: 100 });
      if (fs.existsSync(input)) fs.unlinkSync(input);
    })
    .save(output);
}

startServer();
