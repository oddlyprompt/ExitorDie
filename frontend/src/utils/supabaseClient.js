import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);