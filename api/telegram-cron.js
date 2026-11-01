/* Runs daily (vercel.json cron). Sends the monthly Quick Check nudge to anyone who turned check-ins on
   and hasn't done one for 30 days, and gives Rick a morning summary. */
const { createClient } = require('@supabase/supabase-js');
const tg = require('../lib/tg');
module.exports = async (req, res) => {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();
  const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: subs } = await s.from('tg_users').select('chat_id,first_name,last_level,last_check,last_nudge').eq('checkins', true).limit(1000);
  const old = t => !t || t < cutoff;
  const due = (subs || []).filter(u => old(u.last_check) && old(u.last_nudge)).slice(0, 200);
  let sent = 0;
  for (const u of due) {
    await tg.send(u.chat_id, `Hi ${tg.esc(u.first_name || 'there')} 👋 Time for your monthly check-in.${u.last_level ? ` Last time you were Level ${u.last_level}/10.` : ''} Three minutes — let's see if you've moved.`,
      [[{ text: '⚡ Start my check-in', callback_data: 't:quick-check' }], [{ text: '🔕 Stop monthly check-ins', callback_data: 'm:checkins' }]]);
    await s.from('tg_users').update({ last_nudge: new Date().toISOString() }).eq('chat_id', u.chat_id);
    sent++;
  }
  const since = new Date(Date.now() - 86400000).toISOString();
  const [{ count: tests }, { data: paid }, { count: pending }] = await Promise.all([
    s.from('test_results').select('id', { count: 'exact', head: true }).gte('created_at', since),
    s.from('profile_reports').select('id').eq('paid', true).gte('created_at', since),
    s.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ]);
  await tg.admin(`☀️ <b>Morning, Ric</b>\nYesterday: ${tests || 0} free tests · ${(paid || []).length} reports sold\nReviews waiting: ${pending || 0}${pending ? ' — send /reviews' : ''}\nCheck-ins sent today: ${sent}`);
  res.status(200).json({ sent });
};
