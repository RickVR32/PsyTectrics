/* POST {action:'subscribe', plan:'monthly'|'yearly'} → Stripe Checkout for the membership.
   POST {action:'portal'} → Stripe billing portal (change card, cancel, invoices). */
const Stripe = require('stripe');
const { userFromReq, membership } = require('../auth');
const SITE = () => process.env.SITE_URL || 'https://psytectrics.com';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await userFromReq(req);
  if (!user) return res.status(401).json({ error: 'Please sign in first.' });
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const { action, plan } = req.body || {};
  try {
    const m = await membership(user.email);
    if (action === 'portal') {
      if (!m || !m.stripe_customer_id) return res.status(400).json({ error: 'No membership found for this email.' });
      const p = await stripe.billingPortal.sessions.create({ customer: m.stripe_customer_id, return_url: `${SITE()}/account.html` });
      return res.status(200).json({ url: p.url });
    }
    if (action === 'subscribe') {
      if (m && m.active) return res.status(400).json({ error: 'You are already a member.' });
      const price = plan === 'yearly' ? process.env.STRIPE_MEMBER_YEARLY_PRICE_ID : process.env.STRIPE_MEMBER_MONTHLY_PRICE_ID;
      if (!price) return res.status(503).json({ error: 'Membership is not open yet.' });
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price, quantity: 1 }],
        allow_promotion_codes: true,
        ...(m && m.stripe_customer_id ? { customer: m.stripe_customer_id } : { customer_email: user.email }),
        client_reference_id: user.id,
        metadata: { member_email: user.email },
        subscription_data: { metadata: { member_email: user.email } },
        success_url: `${SITE()}/account.html?joined=1`,
        cancel_url: `${SITE()}/account.html#membership`
      });
      return res.status(200).json({ url: session.url });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    console.error('membership error', e);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
