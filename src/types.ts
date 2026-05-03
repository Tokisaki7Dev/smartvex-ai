import { 
  Wand2, Scissors, Type, Zap, Music, FileType, 
  Layout, BarChart3, Calendar, Settings 
} from 'lucide-react';

export type ToolType = 'Clipping' | 'Subtitles' | 'Compression' | 'Conversion' | 'Audio' | 'Enhancer' | 'Analytics' | 'Calendar';

export interface VideoJob {
  id: string;
  name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  tool: ToolType;
  outputUrl?: string;
  error?: string;
  userId: string;
  createdAt: string;
}

export const TOOLS = [
  {
    id: 'enhancer',
    type: 'Enhancer' as ToolType,
    name: 'AI Enhancer',
    description: 'Nitidez e redução de ruído Xeon Gold',
    icon: Wand2,
    settings: [
      { id: 'sharpness', label: 'Nitidez IA', type: 'slider', default: 50, min: 0, max: 100 },
      { id: 'denoise', label: 'Denoise', type: 'toggle', default: true }
    ]
  },
  {
    id: 'clipping',
    type: 'Clipping' as ToolType,
    name: 'Auto Cut',
    description: 'Corte inteligente de silêncios',
    icon: Scissors,
    settings: []
  },
  {
    id: 'subtitles',
    type: 'Subtitles' as ToolType,
    name: 'Legendas IA',
    description: 'Transcrição e queima de legenda',
    icon: Type,
    settings: []
  },
  {
    id: 'compression',
    type: 'Compression' as ToolType,
    name: 'Compressor',
    description: 'Redução de tamanho sem perda de 4K',
    icon: Zap,
    settings: []
  },
  {
    id: 'audio',
    type: 'Audio' as ToolType,
    name: 'Master Audio',
    description: 'Upgrade de áudio e limpeza orbital',
    icon: Music,
    settings: []
  },
  {
    id: 'conversion',
    type: 'Conversion' as ToolType,
    name: 'Conversor',
    description: 'Exportação multi-formato ultra rápida',
    icon: FileType,
    settings: []
  }
];
