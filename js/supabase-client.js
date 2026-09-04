(function () {
  const cfg = window.EMERALD_CONFIG || {};
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || cfg.SUPABASE_URL.includes('YOUR-PROJECT')) {
    window.emeraldReady = false;
    window.emeraldConfigMissing = true;
    return;
  }
  if (!window.supabase) return;
  window.sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.emeraldReady = true;
})();
