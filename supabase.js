// Server-only Supabase client. Never import this file from public/.
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('[Supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured. Demo JSON mode remains available.');
}

const supabase = (url && key)
  ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

async function dbHealth() {
  if (!supabase) return { configured: false, connected: false };
  const { error } = await supabase.from('site_settings').select('id').eq('id', true).maybeSingle();
  return { configured: true, connected: !error, error: error ? error.message : null };
}

async function getProfile(userId) {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

module.exports = { supabase, dbHealth, getProfile };
