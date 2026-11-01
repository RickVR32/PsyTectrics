const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Server-side allow-list: the browser chooses a product, never a price.
const PRICES = {
  observer: { '1': 'price_1ThuECBb2S75affdGtsHdPnp' },
  business: {
    '1': 'price_1ThuLgBb2S75affdHzaoJSyp',
    '2-5': 'price_1ThuNkBb2S75affd4bbjWdQF',
    '6-10': 'price_1ThuPUBb2S75affdIDSJRZe1'
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD = 20000; // characters per field (conversation pastes can be long)

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { type, scope = '1', fields } = req.body || {};
    const priceId = PRICES[type]?.[scope];
    if (!priceId) return res.status(400).json({ error: 'Unknown report type.' });
    if (!fields || typeof fields !== 'object') return res.status(400).json({ error: 'Missing form data.' });

    const clean = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === 'string') clean[k] = v.slice(0, MAX_FIELD);
    }
    if (!clean.your_name || !clean.your_contact) {
      return res.status(400).json({ error: 'Name and contact are required.' });
    }

    const { data: row, error: dbError } = await supabase
      .from('report_requests')
      .insert({
        report_type: type,
        scope,
        name: clean.your_name,
        contact: clean.your_contact,
        fields: clean,
        paid: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ error: 'Could not save your submission. Please try again.' });
    }

    const page = type === 'observer' ? 'observer.html' : 'business.html';
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      ...(EMAIL_RE.test(clean.your_contact) ? { customer_email: clean.your_contact } : {}),
      success_url: `${process.env.SITE_URL}/${page}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/${page}`,
      client_reference_id: row.id,
      metadata: { request_id: row.id, report_type: type, scope }
    });

    await supabase.from('report_requests').update({ stripe_session_id: session.id }).eq('id', row.id);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-report-checkout error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
