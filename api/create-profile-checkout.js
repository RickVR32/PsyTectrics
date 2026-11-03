const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const E = require('../sc-engine.js');
const PACK = require('../tests/awareness-profile.json');
const { encode } = require('../lib/source-code');
const { userFromReq, membership } = require('../lib/auth');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Awareness Profile v4: scores the answers on the server, issues the Source Code,
// saves everything, then opens Stripe Checkout (promo codes allowed).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await userFromReq(req);
    const body = req.body || {};
    const email = user ? user.email : body.email;
    const { name, answers, marketingOptIn } = body;
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email address is required.' });
    if (!Array.isArray(answers) || answers.length !== PACK.items.length || !answers.every(a => Number.isInteger(a) && a >= 1 && a <= 5)) {
      return res.status(400).json({ error: 'Please answer every question.' });
    }
    const keyed = {}; PACK.items.forEach((it, i) => keyed[it.id] = answers[i]);
    const R = E.score(PACK, keyed);
    let sourceCode = null;
    try { sourceCode = encode({ test: PACK.id, answers, level: R.level, type: R.type }); }
    catch (e) { console.error('Source Code not issued (is SC_CODE_KEY set?):', e.message); }

    const { data: row, error } = await supabase.from('profile_reports').insert({
      email: String(email).toLowerCase(), name: (name || '').slice(0, 120) || null, test: PACK.id, answers, source_code: sourceCode,
      level: R.level, profile_type: R.type, marketing_opt_in: marketingOptIn === true, paid: false
    }).select().single();
    if (error) { console.error('profile_reports insert error:', error); return res.status(500).json({ error: 'Could not save your answers. Please try again.' }); }

    // Members: the full report is included, so skip checkout and open it straight away
    const member = user ? await membership(user.email) : null;
    if (member && member.active) {
      await supabase.from('profile_reports').update({ paid: true }).eq('id', row.id);
      return res.status(200).json({ url: `/report.html?rid=${row.id}`, member: true });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: process.env.STRIPE_PROFILE_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      allow_promotion_codes: true,
      customer_email: email,
      success_url: `${process.env.SITE_URL}/report.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/test.html?t=awareness-profile`,
      client_reference_id: row.id,
      metadata: { profile_id: row.id }
    });
    await supabase.from('profile_reports').update({ stripe_session_id: session.id }).eq('id', row.id);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-profile-checkout error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
