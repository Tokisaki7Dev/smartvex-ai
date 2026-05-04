import { 
  Scissors, 
  Type, 
  Calendar, 
  Layers, 
  Mic2, 
  BarChart3, 
  Sparkles, 
  Monitor 
} from 'lucide-react';

export type ToolType = 
  | 'Clipping' 
  | 'Captioning' 
  | 'Calendar' 
  | 'BRoll' 
  | 'Voiceover' 
  | 'Analytics' 
  | 'Cleaning' 
  | 'Reframe';

export interface VideoJob {
  id: string;
  name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  tool: ToolType;
  outputUrl?: string;
  userId: string;
  createdAt: string;
  error?: string;
}

export interface ToolDefinition {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  icon: any;
  color: string;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'clipping',
    type: 'Clipping',
    name: 'AI Clipping',
    description: 'Transforme vídeos longos em shorts virais com 1 clique.',
    icon: Scissors,
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'captioning',
    type: 'Captioning',
    name: 'AI Captioning',
    description: 'Legendas animadas para impulsionar o engajamento visual.',
    icon: Type,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'calendar',
    type: 'Calendar',
    name: 'Social Calendar',
    description: 'Publique, agende e gerencie todos os seus posts sociais.',
    icon: Calendar,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'broll',
    type: 'BRoll',
    name: 'AI B-Roll',
    description: 'Adicione automaticamente B-Rolls para aumentar retenção.',
    icon: Layers,
    color: 'from-orange-500 to-yellow-500'
  },
  {
    id: 'voiceover',
    type: 'Voiceover',
    name: 'AI Voiceover',
    description: 'Gere vozes realistas com IA para narrativas poderosas.',
    icon: Mic2,
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'analytics',
    type: 'Analytics',
    name: 'Analytics AI',
    description: 'Analise a performance dos seus vídeos e cresça rápido.',
    icon: BarChart3,
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'cleaning',
    type: 'Cleaning',
    name: 'Audio Cleaning',
    description: 'Remova ruídos e melhore o áudio instantaneamente.',
    icon: Sparkles,
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'reframe',
    type: 'Reframe',
    name: 'AI Reframe',
    description: 'Enquadramento automático para 9:16, 16:9 ou 1:1.',
    icon: Monitor,
    color: 'from-red-500 to-orange-500'
  }
];
