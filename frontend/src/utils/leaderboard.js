import { supabase } from './supabaseClient.js';

/**
 * Fetch scores (paged) for the given filter.
 * filter: 'ALL' | 'DAILY' | 'CUSTOM'
 */
export async function fetchScores(page = 0, pageSize = 10, filter = 'ALL') {
  let query = supabase
    .from('leaderboard')
    .select('username, score, depth, seed_string, mode, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (filter === 'DAILY') query = query.eq('mode', 'daily');
  if (filter === 'CUSTOM') query = query.eq('mode', 'custom');

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}

/**
 * Submit a score row.
 * mode: null (normal), 'daily', or 'custom'
 */
export async function submitScore({ username, score, depth, seedString, mode }) {
  const { error } = await supabase.from('leaderboard').insert([{
    username,
    score,
    depth,
    seed_string: seedString,
    mode
  }]);

  if (error) throw error;
}