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

export interface ToolDefinition {
  id: string;
  name: string;
  type: ToolType;
  icon: LucideIcon;
  description: string;
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
  { id: '01', name: 'AI Clipping', type: 'Clipping', icon: Scissors, description: 'Transforme vídeos longos em Shorts/Reels virais em 1 clique.' },
  { id: '02', name: 'AI Captioning', type: 'Captioning', icon: Type, description: 'Adicione legendas animadas dinâmicas para reter a atenção.' },
  { id: '03', name: 'Compressor', type: 'Compression', icon: Film, description: 'Comprima seus vídeos sem perder a qualidade visual (H.265).' },
  { id: '04', name: 'Conversor', type: 'Conversion', icon: Smartphone, description: 'Converta entre formatos (MP4, MKV, MOV) instantaneamente.' },
  { id: '05', name: 'Audio Clean', type: 'AudioCleaning', icon: Wand2, description: 'Remova ruídos, pausas e palavras de preenchimento com IA.' },
  { id: '06', name: 'Enhancer 4K', type: 'Enhancer', icon: Mic, description: 'Upscale inteligente para 4K e restauração de nitidez.' },
];
