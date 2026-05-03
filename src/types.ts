import { 
  Scissors, 
  Type, 
  Film, 
  Smartphone, 
  Mic, 
  LucideIcon,
  Wand2,
  Calendar,
  BarChart3,
  LayoutTemplate,
  Waves,
  Zap,
  Sparkles,
  Search
} from "lucide-react";

export type ToolType = 
  'Clipping' | 
  'Captioning' | 
  'BRoll' | 
  'FaceFocus' | 
  'AudioCleaning' | 
  'Voiceover' | 
  'Enhancer' | 
  'Analytics' | 
  'Calendar';

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
    name: 'AI clipping', 
    type: 'Clipping', 
    icon: Scissors, 
    description: 'Turn long videos into viral shorts in 1 click.',
    settings: [
      { id: 'ratio', label: 'Formato', type: 'select', options: ['9:16 (TikTok)', '1:1 (Insta)', '16:9 (YouTube)'], default: '9:16 (TikTok)' },
      { id: 'detection', label: 'IA Sensitivity', type: 'slider', min: 0, max: 100, default: 85 }
    ]
  },
  { 
    id: '02', 
    name: 'AI captioning', 
    type: 'Captioning', 
    icon: Type, 
    description: 'Add animated captions to your video to boost visual appeal.',
    settings: [
      { id: 'style', label: 'Estilo', type: 'select', options: ['Alex Hormozi', 'MrBeast', 'Minimalist', 'Neon Pulse'], default: 'Alex Hormozi' },
      { id: 'emojis', label: 'Auto-Emojis', type: 'toggle', default: true }
    ]
  },
  { 
    id: '03', 
    name: 'AI B-Roll', 
    type: 'BRoll', 
    icon: Sparkles, 
    description: 'Automatically add AI B-Roll to boost watch time.',
    settings: [
      { id: 'intensity', label: 'Density', type: 'select', options: ['Low', 'Medium', 'Aggressive'], default: 'Medium' }
    ]
  },
  { 
    id: '04', 
    name: 'AI reframe', 
    type: 'FaceFocus', 
    icon: LayoutTemplate, 
    description: 'Automatically reframe your videos to 9:16, 16:9, or 1:1.',
    settings: [
      { id: 'ratio', label: 'Ratio', type: 'select', options: ['9:16', '16:9', '1:1'], default: '9:16' }
    ]
  },
  { 
    id: '05', 
    name: 'Audio cleaning', 
    type: 'AudioCleaning', 
    icon: Waves, 
    description: 'Remove filler words, pauses & enhance audio in 1 click.',
    settings: [
      { id: 'deep_clean', label: 'Deep Clean', type: 'toggle', default: true },
      { id: 'noise_level', label: 'Redução de Ruído', type: 'slider', min: 0, max: 100, default: 80 }
    ]
  },
  { 
    id: '06', 
    name: 'AI voiceover', 
    type: 'Voiceover', 
    icon: Mic, 
    description: 'Generate realistic speech with AI to increase video watch time.',
    settings: [
      { id: 'voice', label: 'IA Voice', type: 'select', options: ['Male (Bold)', 'Female (Soft)', 'Deep Narrator'], default: 'Male (Bold)' }
    ]
  },
  { 
    id: '07', 
    name: 'Enhancer 4K', 
    type: 'Enhancer', 
    icon: Wand2, 
    description: 'Upscale inteligente via AVX-512 Xeon Pipeline.',
    settings: [
      { id: 'scale', label: 'Upscale', type: 'select', options: ['2x (1080p)', '4x (4K)'], default: '4x (4K)' },
      { id: 'sharpen', label: 'Nitidez', type: 'slider', min: 0, max: 100, default: 50 }
    ]
  },
  { 
    id: '08', 
    name: 'Analytics', 
    type: 'Analytics', 
    icon: BarChart3, 
    description: 'Analyze your video performance to unlock growth insights.',
    settings: [
      { id: 'platform', label: 'Platform', type: 'select', options: ['TikTok', 'Instagram', 'YouTube'], default: 'TikTok' }
    ]
  },
  { 
    id: '09', 
    name: 'Social Calendar', 
    type: 'Calendar', 
    icon: Calendar, 
    description: 'Publish, schedule & manage all your social posts in one place.',
    settings: [
      { id: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'EST', 'BRT'], default: 'BRT' }
    ]
  }
];
