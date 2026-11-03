/* Logged-in visitors send their Supabase access token as "Authorization: Bearer …".
   We check it with Supabase on the server, so nobody can claim someone else's email. */
const { createClient } = require('@supabase/supabase-js');
let client;
const db = () => client || (client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } }));

async function userFromReq(req) {
  const h = req.headers && (req.headers.authorization || req.headers.Authorization);
  const token = h && /^Bearer\s+(.+)$/i.exec(h);
  if (!token) return null;
  try {
    const { data, error } = await db().auth.getUser(token[1]);
    if (error || !data || !data.user || !data.user.email) return null;
    return { id: data.user.id, email: data.user.email.toLowerCase() };
  } catch (e) { console.error('auth check failed', e.message); return null; }
}

async function membership(email) {
  if (!email) return null;
  const { data } = await db().from('members').select('*').eq('email', email.toLowerCase()).maybeSingle();
  if (!data) return null;
  const active = ['active', 'trialing'].includes(data.status) && (!data.current_period_end || new Date(data.current_period_end) > new Date());
  return { ...data, active };
}

module.exports = { userFromReq, membership, db };
