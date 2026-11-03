/* PsyTectrics sign-in (Supabase magic link). Loads the Supabase client, keeps the session,
   and adds an "Account" link to the nav. Pages use:
     PTAuth.ready.then(...)  PTAuth.user()  PTAuth.token()  PTAuth.signIn(email, next)  PTAuth.signOut()  */
(function () {
  const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  let client = null, session = null, resolveReady;
  const ready = new Promise(r => { resolveReady = r; });
  const PTAuth = window.PTAuth = {
    ready, client: () => client,
    user: () => session && session.user ? { id: session.user.id, email: session.user.email } : null,
    token: () => session ? session.access_token : null,
    async signIn(email, next) {
      await ready; if (!client) throw new Error('Sign-in is not set up yet.');
      const to = new URL('account.html', location.href); if (next) to.searchParams.set('next', next);
      const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: to.href } });
      if (error) throw new Error(/rate|seconds/i.test(error.message) ? 'Please wait a minute before asking for another link.' : error.message);
    },
    async signOut() { await ready; if (client) await client.auth.signOut(); session = null; navLink(); },
    authHeader: () => session ? { Authorization: 'Bearer ' + session.access_token } : {},
    _me: null,
    async me(fresh) { // the dashboard data (membership, results); cached per page
      await ready; if (!session) return null;
      if (!fresh && PTAuth._me) return PTAuth._me;
      try { const r = await fetch('/api/me', { headers: PTAuth.authHeader() }); PTAuth._me = r.ok ? await r.json() : null; } catch (e) { PTAuth._me = null; }
      return PTAuth._me;
    }
  };

  function navLink() {
    const label = session ? 'Account' : 'Sign in';
    document.querySelectorAll('.nav-links, .nav-drawer').forEach(nav => {
      let a = nav.querySelector('a[data-pt-account]');
      if (!a) { a = document.createElement('a'); a.href = 'account.html'; a.setAttribute('data-pt-account', ''); const cta = nav.querySelector('.nav-cta, .drawer-cta'); nav.insertBefore(a, cta && cta.parentNode === nav ? cta : null); }
      a.textContent = label;
    });
  }

  function load(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }

  (async () => {
    try {
      const cfg = await fetch('/api/config').then(r => r.ok ? r.json() : null);
      if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('no config');
      await load(SDK);
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data } = await client.auth.getSession(); session = data.session;
      client.auth.onAuthStateChange((_e, s) => { session = s; navLink(); });
    } catch (e) { /* sign-in not configured: the site still works without it */ }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', navLink); else navLink();
    resolveReady();
  })();
})();
