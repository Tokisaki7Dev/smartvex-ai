import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nvdnuwtnewnkoknmhkif.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Qrh3HUz-NHGq2xwWheZmXQ_X4w6Z3ej';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
