import { 
  Scissors, 
  Type, 
  Film, 
  Smartphone, 
  Mic, 
  LucideIcon,
  Wand2
} from "lucide-react";

export type ToolType = 'Clipping' | 'Captioning' | 'Compression' | 'Conversion' | 'AudioCleaning' | 'Enhancer';

export interface ToolOption {
  id: string;
  label: string;
  type: 'select' | 'slider' | 'toggle';
  options?: string[];
  min?: number;
  max?: number;
  default: any;
}

export interface ToolDefinition {
  id: string;
  name: string;
  type: ToolType;
  icon: LucideIcon;
  description: string;
  settings: ToolOption[];
}

export interface VideoJob {
  id: string;
  name: string;
  tool: ToolType;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  userId: string;
  createdAt: any;
  outputUrl?: string;
}

export const TOOLS: ToolDefinition[] = [
  { 
    id: '01', 
    name: 'AI Clipping', 
    type: 'Clipping', 
    icon: Scissors, 
    description: 'Transforme vídeos longos em Shorts/Reels virais.',
    settings: [
      { id: 'ratio', label: 'Formato', type: 'select', options: ['9:16 (TikTok)', '1:1 (Insta)', '16:9 (YouTube)'], default: '9:16 (TikTok)' },
      { id: 'duration', label: 'Duração Máxima', type: 'select', options: ['30s', '60s', '90s'], default: '60s' }
    ]
  },
  { 
    id: '02', 
    name: 'AI Captioning', 
    type: 'Captioning', 
    icon: Type, 
    description: 'Legendas dinâmicas com detecção de ênfase.',
    settings: [
      { id: 'style', label: 'Estilo', type: 'select', options: ['Alex Hormozi', 'MrBeast', 'Minimalist', 'Neon Pulse'], default: 'Alex Hormozi' },
      { id: 'emojis', label: 'Auto-Emojis', type: 'toggle', default: true }
    ]
  },
  { 
    id: '03', 
    name: 'Compressor', 
    type: 'Compression', 
    icon: Film, 
    description: 'Reduza o tamanho mantendo a fidelidade visual.',
    settings: [
      { id: 'preset', label: 'Preset', type: 'select', options: ['Ultra High', 'Balanced', 'Small Size'], default: 'Balanced' },
      { id: 'codec', label: 'Codec', type: 'select', options: ['H.264', 'H.265 (HEVC)', 'AV1'], default: 'H.265 (HEVC)' }
    ]
  },
  { 
    id: '04', 
    name: 'Conversor', 
    type: 'Conversion', 
    icon: Smartphone, 
    description: 'Mudança de containers e codecs instantânea.',
    settings: [
      { id: 'format', label: 'Formato de Saída', type: 'select', options: ['MP4', 'MKV', 'MOV', 'WEBM'], default: 'MP4' }
    ]
  },
  { 
    id: '05', 
    name: 'Audio Clean', 
    type: 'AudioCleaning', 
    icon: Wand2, 
    description: 'Remova ruídos e ecos via rede neural.',
    settings: [
      { id: 'noise_level', label: 'Redução de Ruído', type: 'slider', min: 0, max: 100, default: 80 },
      { id: 'normalize', label: 'Normalizar Audio', type: 'toggle', default: true }
    ]
  },
  { 
    id: '06', 
    name: 'Enhancer 4K', 
    type: 'Enhancer', 
    icon: Mic, 
    description: 'Upscale inteligente Xeon-optimized.',
    settings: [
      { id: 'scale', label: 'Upscale', type: 'select', options: ['2x (1080p)', '4x (4K)'], default: '4x (4K)' },
      { id: 'sharpen', label: 'Nitidez', type: 'slider', min: 0, max: 100, default: 50 }
    ]
  },
];
