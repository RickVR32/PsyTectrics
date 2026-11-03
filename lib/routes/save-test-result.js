/* Saves a free test result, issues its Source Code and (optionally) emails it.
   Scores on the server so the stored result can be trusted. Logged-in visitors send their
   Supabase token instead of typing an email, and the result lands in their dashboard. */
const { createClient } = require('@supabase/supabase-js');
const { PACKS, NAMES, score, valid } = require('../packs');
const { encode } = require('../source-code');
const { userFromReq } = require('../auth');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function summaryOf(R) {
  if (R.couples) return { couples: true, me: summaryOf(R.me), partner: summaryOf(R.partner) };
  return { level: R.level, stage: R.stage, type: R.type, ring: R.ring, lean: Math.round(R.lean), charge: Math.round(R.charge),
    regulation: Math.round(R.regulation), drift: +R.drift.toFixed(1), needs: (R.needs || []).map(n => n.name) };
}
function text(test, s) {
  if (s.couples) return `You: Level ${s.me.level}/10, ${s.me.type}\nYour partner (as you see them): Level ${s.partner.level}/10, ${s.partner.type}`;
  return `Level ${s.level}/10 (${s.stage}) · Ring ${s.ring}\nLean ${s.lean} (negative = Narc, positive = Empath) · Regulation ${s.regulation} · Drift ${s.drift}\n` +
    'What needs balancing: ' + (s.needs.join(', ') || 'nothing major');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { test, marketingOptIn, answers } = req.body || {};
  const pack = PACKS[test];
  if (!pack) return res.status(400).json({ error: 'Unknown test.' });
  if (!valid(pack, answers)) return res.status(400).json({ error: 'Please answer every question.' });
  const user = await userFromReq(req);
  const email = user ? user.email : String((req.body || {}).email || '').trim();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email required.' });

  const R = score(pack, answers), s = summaryOf(R);
  let code = null;
  try { code = encode({ test, answers, level: R.couples ? R.me.level : R.level, type: R.couples ? R.me.type : R.type }); }
  catch (e) { console.error('Source Code not issued:', e.message); }

  const { error } = await supabase.from('test_results').insert({
    test, email: email.toLowerCase(), marketing_opt_in: marketingOptIn === true, answers, result: { ...s, code }
  });
  if (error) { console.error('test_results insert error:', error); return res.status(500).json({ error: 'Could not save.' }); }

  let emailed = false;
  if (!user && process.env.RESEND_API_KEY && process.env.RESULTS_FROM_EMAIL) {
    try {
      const site = process.env.SITE_URL || 'https://psytectrics.com';
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.RESULTS_FROM_EMAIL, to: email, subject: `Your PsyTectrics ${NAMES[test]} result`,
          text: `Here's your ${NAMES[test]} result.\n\n${text(test, s)}\n\n` + (code ? `Your Source Code: ${code}\nSee your Balance Map any time: ${site}/test.html?code=${encodeURIComponent(code)}\n\n` : '') +
            `Save all your results in one place: ${site}/account.html\n\nThis is a self-reflection tool, not a psychological assessment or diagnosis.\nPsyTectrics · hello@psytectrics.com` })
      });
      emailed = r.ok; if (!r.ok) console.error('Resend error:', r.status, await r.text());
    } catch (e) { console.error('Resend error:', e); }
  }
  return res.status(200).json({ saved: true, emailed, code, account: !!user });
};
