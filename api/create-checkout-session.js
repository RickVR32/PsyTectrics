const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, submission } = req.body || {};

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!submission || !submission.answers) {
      return res.status(400).json({ error: 'Missing assessment data.' });
    }

    // Save the submission immediately, unpaid. This means you capture every
    // completed assessment (including friends who don't pay) for feedback review.
    const { data: row, error: dbError } = await supabase
      .from('solo_submissions')
      .insert({
        email,
        name: submission.name || null,
        age_band: submission.age || null,
        context: submission.ctx || null,
        most_like_self: submission.most || null,
        least_like_self: submission.least || null,
        answers: submission.answers,
        narc_pct: submission.narc,
        sist_pct: submission.sist,
        yarc_pct: submission.yarc,
        oll_pct: submission.oll,
        awareness_level: submission.awarenessLevel,
        awareness_index: submission.bs,
        drift: submission.drift,
        encoded_code: submission.encoded,
        marketing_opt_in: submission.marketingOptIn !== false,
        paid: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ error: 'Could not save your submission. Please try again.' });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: process.env.STRIPE_SOLO_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      customer_email: email,
      success_url: `${process.env.SITE_URL}/solo.html?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/solo.html`,
      client_reference_id: row.id,
      metadata: { submission_id: row.id }
    });

    // Link the Stripe session back to the row so the webhook can find it
    await supabase.from('solo_submissions').update({ stripe_session_id: session.id }).eq('id', row.id);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
