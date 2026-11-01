const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Called by solo.html when the customer returns from Stripe.
// Only releases the saved answers if Stripe confirms the session was paid,
// so adding ?paid=1 to the URL no longer unlocks the report.
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sessionId = String(req.query.session_id || '');
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed.' });
    }

    const submissionId = session.metadata?.submission_id || session.client_reference_id;
    if (!submissionId) return res.status(404).json({ error: 'Submission not found.' });

    const { data: row, error } = await supabase
      .from('solo_submissions')
      .select('id, name, age_band, context, most_like_self, least_like_self, answers, paid')
      .eq('id', submissionId)
      .single();

    if (error || !row) return res.status(404).json({ error: 'Submission not found.' });

    // Backup in case the webhook hasn't fired yet
    if (!row.paid) {
      await supabase.from('solo_submissions').update({ paid: true }).eq('id', row.id);
    }

    return res.status(200).json({
      name: row.name || '',
      age: row.age_band || '',
      ctx: row.context || '',
      most: row.most_like_self || '',
      least: row.least_like_self || '',
      answers: row.answers
    });
  } catch (err) {
    console.error('verify-session error:', err);
    return res.status(500).json({ error: 'Could not verify payment.' });
  }
};
