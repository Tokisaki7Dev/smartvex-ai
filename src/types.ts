import { 
  Scissors, 
  Type, 
  Film, 
  Smartphone, 
  Mic, 
  LucideIcon,
  Wand2
} from "lucide-react";

export type ToolType = 'Clipping' | 'Captioning' | 'BRoll' | 'Reframe' | 'Voiceover' | 'AudioCleaning';

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
  { id: '03', name: 'AI B-Roll', type: 'BRoll', icon: Film, description: 'Insira automaticamente B-rolls relevantes gerados por IA.' },
  { id: '04', name: 'AI Reframe', type: 'Reframe', icon: Smartphone, description: 'Reenquadramento automático inteligente para 9:16 (TikTok).' },
  { id: '05', name: 'Audio Cleaning', type: 'AudioCleaning', icon: Wand2, description: 'Remova ruídos, pausas curtas e palavras de preenchimento.' },
  { id: '06', name: 'Voiceover AI', type: 'Voiceover', icon: Mic, description: 'Gere locuções realistas a partir de texto instantaneamente.' },
];
