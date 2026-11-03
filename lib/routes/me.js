/* The member dashboard: GET = everything saved under the signed-in email.
   POST {marketing} = update the marketing choice. DELETE = remove saved results and the login. */
const { userFromReq, membership, db } = require('../auth');
const { NAMES } = require('../packs');

module.exports = async (req, res) => {
  const user = await userFromReq(req);
  if (!user) return res.status(401).json({ error: 'Please sign in again.' });
  const s = db(), email = user.email;

  if (req.method === 'POST') {
    const marketing = (req.body || {}).marketing === true;
    await s.from('accounts').upsert({ email, marketing_opt_in: marketing, updated_at: new Date().toISOString() });
    return res.status(200).json({ ok: true, marketing });
  }
  if (req.method === 'DELETE') {
    await s.from('test_results').delete().eq('email', email);
    await s.from('accounts').delete().eq('email', email);
    try { await s.auth.admin.deleteUser(user.id); } catch (e) { console.error('deleteUser', e.message); }
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await s.from('accounts').upsert({ email, last_seen: new Date().toISOString() }, { onConflict: 'email', ignoreDuplicates: false });
  const [{ data: acct }, { data: results }, { data: reports }, member] = await Promise.all([
    s.from('accounts').select('marketing_opt_in').eq('email', email).maybeSingle(),
    s.from('test_results').select('id,created_at,test,result').ilike('email', email).order('created_at', { ascending: false }).limit(100),
    s.from('profile_reports').select('id,created_at,level,profile_type,source_code,stripe_session_id').ilike('email', email).eq('paid', true).order('created_at', { ascending: false }).limit(50),
    membership(email)
  ]);
  return res.status(200).json({
    email,
    marketing: !!(acct && acct.marketing_opt_in),
    member: member ? { active: member.active, plan: member.plan, status: member.status, renews: member.current_period_end, cancelAtPeriodEnd: !!member.cancel_at_period_end } : null,
    results: (results || []).map(r => ({ id: r.id, date: r.created_at, test: r.test, name: NAMES[r.test] || r.test,
      level: r.result && (r.result.level || (r.result.me && r.result.me.level)), type: r.result && (r.result.type || (r.result.me && r.result.me.type)), code: r.result && r.result.code })),
    reports: (reports || []).map(r => ({ id: r.id, date: r.created_at, level: r.level, type: r.profile_type, code: r.source_code, session: r.stripe_session_id }))
  });
};
