const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const tg = require('../lib/tg');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Stripe needs the raw request body to verify the webhook signature,
// so we must disable Vercel's automatic JSON body parsing for this route.
module.exports.config = {
  api: { bodyParser: false }
};

// Emails you (via Formspree) when a report is paid for, so you know to write it.
async function notify(subject, fields) {
  const url = process.env.FORMSPREE_URL || 'https://formspree.io/f/mreorpre';
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: subject, ...fields })
    });
  } catch (e) { console.error('Formspree notify failed:', e); }
  try {
    const lines = Object.entries(fields).filter(([, v]) => v !== '' && v != null && typeof v !== 'object').slice(0, 8).map(([k, v]) => `${k}: ${tg.esc(String(v).slice(0, 200))}`);
    await tg.admin(`💷 <b>${tg.esc(subject)}</b>\n${lines.join('\n')}`);
  } catch (e) { console.error('Telegram notify failed:', e); }
}


function planOf(sub) {
  const it = sub.items && sub.items.data && sub.items.data[0];
  const iv = it && it.price && it.price.recurring && it.price.recurring.interval;
  return iv === 'year' ? 'yearly' : 'monthly';
}
async function saveSubscription(sub, emailHint) {
  const email = String(emailHint || (sub.metadata && sub.metadata.member_email) || '').toLowerCase();
  const end = sub.current_period_end || (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].current_period_end);
  const row = { stripe_customer_id: sub.customer, stripe_subscription_id: sub.id, status: sub.status, plan: planOf(sub),
    current_period_end: end ? new Date(end * 1000).toISOString() : null, cancel_at_period_end: !!sub.cancel_at_period_end, updated_at: new Date().toISOString() };
  if (email) {
    const { error } = await supabase.from('members').upsert({ email, ...row }, { onConflict: 'email' });
    if (error) console.error('members upsert', error);
  } else {
    const { error } = await supabase.from('members').update(row).eq('stripe_subscription_id', sub.id);
    if (error) console.error('members update', error);
  }
  if (sub.status === 'canceled') await notify(`Membership ended — ${email || sub.customer}`, { plan: row.plan });
}

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Membership: keep the members table in step with Stripe
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    await saveSubscription(event.data.object);
  }

  if (event.type === 'checkout.session.completed' && event.data.object.mode === 'subscription') {
    const session = event.data.object;
    try {
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      const email = (session.metadata && session.metadata.member_email) || session.customer_email || (session.customer_details && session.customer_details.email);
      await saveSubscription(sub, email);
      await notify(`New member — ${email}`, { plan: planOf(sub), amount_paid: ((session.amount_total || 0) / 100).toFixed(2) });
    } catch (e) { console.error('subscription checkout error', e); }
  }

  // Shop: card game orders and pre-orders
  const shopType = event.type === 'checkout.session.completed' && event.data.object.metadata && event.data.object.metadata.order_type;
  if (shopType === 'preorder' || shopType === 'order') {
    const s = event.data.object;
    const ship = (s.collected_information && s.collected_information.shipping_details) || s.shipping_details || {};
    const cust = s.customer_details || {};
    const addr = ship.address || cust.address || {};
    let items = {}; try { items = JSON.parse(s.metadata.items || '{}'); } catch (e) {}
    const row = {
      stripe_session_id: s.id, order_type: shopType, status: shopType === 'preorder' ? 'preorder' : 'paid',
      email: String(cust.email || s.customer_email || '').toLowerCase() || null,
      name: ship.name || cust.name || null, items, decks: parseInt(s.metadata.decks, 10) || null,
      amount_total: s.amount_total, currency: s.currency, shipping_address: addr
    };
    const { error } = await supabase.from('orders').upsert(row, { onConflict: 'stripe_session_id' });
    if (error) console.error('orders upsert', error);
    const what = Object.entries(items).map(([k, q]) => `${q} × ${k === 'narcissist' ? 'Narcissist' : 'Bad Habits'}`).join(', ');
    await notify(`${shopType === 'preorder' ? 'Pre-order' : 'Order'} — ${what}`, {
      name: row.name || '', email: row.email || '', total: '£' + ((s.amount_total || 0) / 100).toFixed(2),
      address: [addr.line1, addr.line2, addr.city, addr.postal_code].filter(Boolean).join(', ')
    });
    return res.status(200).json({ received: true });
  }

  if (event.type === 'checkout.session.completed' && event.data.object.mode !== 'subscription') {
    const session = event.data.object;
    const requestId = session.metadata?.request_id;
    const profileId = session.metadata?.profile_id;
    const submissionId = session.metadata?.submission_id || (!requestId && !profileId && session.client_reference_id);

    // Awareness Profile v4 (automated report)
    if (profileId) {
      await supabase.from('profile_reports').update({ paid: true }).eq('id', profileId);
      const { data: pr } = await supabase.from('profile_reports').select('name,email,level,profile_type,source_code').eq('id', profileId).single();
      const promo = (session.total_details && session.total_details.amount_discount) ? ' (discount code used)' : '';
      if (pr) await notify(`Awareness Profile sold${promo} — ${pr.name || pr.email}`, { email: pr.email, level: pr.level, type: pr.profile_type, source_code: pr.source_code || '', amount_paid: (session.amount_total / 100).toFixed(2) });
    }

    // Observer / Business report requests
    if (requestId) {
      const { error } = await supabase
        .from('report_requests')
        .update({ paid: true })
        .eq('id', requestId);

      if (error) console.error('Failed to mark report request as paid:', error);
      const { data: rq } = await supabase.from('report_requests').select('*').eq('id', requestId).single();
      if (rq) await notify(`PAID ${rq.report_type} report — ${rq.name}`, { request_id: rq.id, scope: rq.scope || '', ...rq.fields });
    }

    // Solo assessment
    if (submissionId) {
      const { error } = await supabase
        .from('solo_submissions')
        .update({ paid: true })
        .eq('id', submissionId);

      if (error) console.error('Failed to mark submission as paid:', error);
      const { data: row } = await supabase.from('solo_submissions').select('*').eq('id', submissionId).single();
      if (row) await notify(`PAID Awareness Profile report — ${row.name || row.email}`, {
        submission_id: row.id, name: row.name || '', email: row.email, assessment_code: row.encoded_code,
        age_band: row.age_band || '', context: row.context || '',
        most_like_self: row.most_like_self || '', least_like_self: row.least_like_self || ''
      });
    }
  }

  res.status(200).json({ received: true });
};
