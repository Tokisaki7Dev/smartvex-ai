import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvdnuwtnewnkoknmhkif.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Qrh3HUz-NHGq2xwWheZmXQ_X4w6Z3ej';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
