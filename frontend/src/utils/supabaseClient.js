import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('❌ Supabase env missing', { url, hasAnon: !!anon });
  throw new Error('Supabase URL and anon key are required');
}

export const supabase = createClient(url, anon);

try { console.log('🔌 Supabase project:', new URL(url).host); } catch {}