const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TESTS = { 'quick-check': 'Quick Check', 'narc-check': 'Narc Pattern Self-Check', 'awareness-profile': 'Awareness Profile (v4 preview)' };

function summary(test, r) {
  if (r.version === 'v4') {
    return `Level ${r.level}/10 (${r.stage}) · Ring ${r.ring}\nLean: ${Math.round(r.lean)} (negative = Narc, positive = Empath)\nCharge: ${Math.round(r.charge)} · Regulation: ${Math.round(r.regulation)} · Drift: ${Number(r.drift).toFixed(1)}\n` +
      'What needs balancing: ' + ((r.needs || []).map(n => n.name).join(', ') || 'nothing major');
  }
  if (r.type === 'ratio') {
    return `Dominant pattern: ${r.dominant}\n` + Object.entries(r.pct).map(([k, v]) => `${k}: ${v}%`).join('\n');
  }
  return `Narc Pattern Index: ${r.index}/100 (${r.band})\n` + Object.entries(r.facet).map(([k, v]) => `${k}: ${v}/100`).join('\n');
}

// Saves a free test result when the visitor asks for it by email, and emails it
// if RESEND_API_KEY + RESULTS_FROM_EMAIL are set in Vercel.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { test, email, marketingOptIn, answers, result } = req.body || {};
  if (!TESTS[test]) return res.status(400).json({ error: 'Unknown test.' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Valid email required.' });
  if (!Array.isArray(answers) || answers.length > 100 || !result || typeof result !== 'object') {
    return res.status(400).json({ error: 'Invalid result.' });
  }

  const { error } = await supabase.from('test_results').insert({
    test, email, marketing_opt_in: marketingOptIn === true, answers, result
  });
  if (error) {
    console.error('test_results insert error:', error);
    return res.status(500).json({ error: 'Could not save.' });
  }

  let emailed = false;
  if (process.env.RESEND_API_KEY && process.env.RESULTS_FROM_EMAIL) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESULTS_FROM_EMAIL,
          to: email,
          subject: `Your PsyTectrics ${TESTS[test]} result`,
          text: `Here's your ${TESTS[test]} result.\n\n${summary(test, result)}\n\n` +
                `Want the full picture? Take the free Awareness Profile: ${process.env.SITE_URL || 'https://psytectrics.com'}/solo.html\n\n` +
                `This is a self-reflection tool, not a psychological assessment or diagnosis.\nPsyTectrics · hello@psytectrics.com`
        })
      });
      emailed = r.ok;
      if (!r.ok) console.error('Resend error:', r.status, await r.text());
    } catch (e) { console.error('Resend error:', e); }
  }
  return res.status(200).json({ saved: true, emailed });
};
