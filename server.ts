import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server as SocketServer } from 'socket.io';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;
  const UPLOAD_DIR = path.join(__dirname, 'uploads');
  const OUTPUT_DIR = path.join(__dirname, 'outputs');

  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  });
  const upload = multer({ storage });

  // API Routes
  app.post('/api/v1/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const { tool, settings } = req.body;
    const jobId = Math.random().toString(36).substring(7);
    const inputPath = req.file.path;
    const outputFilename = `output-${jobId}-${req.file.originalname}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    res.json({ jobId, status: 'queued', filename: req.file.originalname });

    // Process Video
    processVideo(jobId, inputPath, outputPath, tool, settings, io);
  });

  app.get('/api/v1/download/:jobId', (req, res) => {
    const { jobId } = req.params;
    const files = fs.readdirSync(OUTPUT_DIR);
    const targetFile = files.find(f => f.includes(jobId));
    
    if (targetFile) {
      res.download(path.join(OUTPUT_DIR, targetFile));
    } else {
      res.status(404).send('File not found');
    }
  });

  // Serve static outputs in production
  app.use('/outputs', express.static(OUTPUT_DIR));

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
    console.log(`🚀 SmartVex Xeon Engine rodando em http://localhost:${PORT}`);
  });
}

function processVideo(jobId: string, input: string, output: string, tool: string, settings: any, io: SocketServer) {
  let command = ffmpeg(input);

  // CPU Optimization for Xeon
  command = command.addOptions([
    '-threads 0', // Utilizar todos os núcleos disponíveis
    '-preset superfast' // Priorizar velocidade no CPU
  ]);

  switch (tool) {
    case 'Clipping':
      // Exemplo: Reframe para 9:16 usando crop/scale
      command.videoFilters('crop=in_h*9/16:in_h,scale=1080:1920');
      break;
    case 'Compression':
      command.videoCodec('libx265').addOption('-crf 28');
      break;
    case 'Enhancer':
      // Denoise e Sharpening via CPU filters
      command.videoFilters([
        'unsharp=5:5:1.0:5:5:0.0',
        'hqdn3d=1.5:1.5:6:6'
      ]);
      break;
    case 'AudioCleaning':
      command.audioFilters('afftdn=nf=-25'); // Noise reduction
      break;
    case 'Conversion':
      // Do nothing, just re-encode (default)
      break;
  }

  command
    .on('start', () => {
      io.emit(`job:${jobId}:status`, { status: 'processing', progress: 0 });
    })
    .on('progress', (progress) => {
      io.emit(`job:${jobId}:status`, { 
        status: 'processing', 
        progress: Math.floor(progress.percent || 0) 
      });
    })
    .on('error', (err) => {
      console.error(`Error processing ${jobId}:`, err);
      io.emit(`job:${jobId}:status`, { status: 'failed', error: err.message });
      if (fs.existsSync(input)) fs.unlinkSync(input);
    })
    .on('end', () => {
      io.emit(`job:${jobId}:status`, { status: 'completed', progress: 100 });
      if (fs.existsSync(input)) fs.unlinkSync(input);
    })
    .save(output);
}

startServer();
