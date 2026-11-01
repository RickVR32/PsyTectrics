const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Releases a paid Awareness Profile (including 100%-off promo codes) so report.html can build the report.
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const sessionId = String(req.query.session_id || '');
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) return res.status(400).json({ error: 'Invalid link.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!['paid', 'no_payment_required'].includes(session.payment_status)) return res.status(402).json({ error: 'Payment not completed.' });
    const id = session.metadata?.profile_id;
    if (!id) return res.status(404).json({ error: 'Report not found.' });
    const { data: row, error } = await supabase.from('profile_reports').select('*').eq('id', id).single();
    if (error || !row) return res.status(404).json({ error: 'Report not found.' });
    if (!row.paid) await supabase.from('profile_reports').update({ paid: true }).eq('id', id);
    return res.status(200).json({ name: row.name || '', date: row.created_at, answers: row.answers, sourceCode: row.source_code, test: row.test });
  } catch (err) {
    console.error('profile-report error:', err);
    return res.status(500).json({ error: 'Could not load your report.' });
  }
};
