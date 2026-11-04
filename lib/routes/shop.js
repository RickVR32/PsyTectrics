/* Shop: pre-orders for the card games.
   GET  /api/shop  -> what the shop page shows (products, prices, shipping, whether pre-orders are open)
   POST /api/shop  { items: { narcissist: 1, 'bad-habits': 2 } } -> Stripe Checkout URL
   Prices are set here (or by env vars), never trusted from the browser.
   Env (all optional): SHOP_OPEN=false closes orders · SHOP_PRICE_PENCE (default 2500)
     SHOP_SHIPPING_PENCE (default 395) · SHOP_FREE_SHIPPING_FROM (decks, default 2)
     SHOP_SHIP_NOTE (text shown on the page and at checkout) · SHOP_MODE=preorder|live */
const Stripe = require('stripe');
const SITE = () => process.env.SITE_URL || 'https://psytectrics.com';
const num = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : d; };

function config() {
  const price = num(process.env.SHOP_PRICE_PENCE, 2500);
  const mode = process.env.SHOP_MODE === 'live' ? 'live' : 'preorder';
  return {
    open: process.env.SHOP_OPEN !== 'false',
    mode,
    currency: 'gbp',
    shipping: num(process.env.SHOP_SHIPPING_PENCE, 395),
    freeFrom: num(process.env.SHOP_FREE_SHIPPING_FROM, 2),
    maxQty: 10,
    shipNote: process.env.SHOP_SHIP_NOTE || (mode === 'preorder'
      ? 'Pre-order: ships as soon as the first print run lands. You can cancel for a full refund any time before it ships.'
      : 'Dispatched within 3 working days.'),
    products: {
      'narcissist': { name: 'Narcissist Card Game', price, image: '/images/shop/narcissist-card-game.jpg',
        blurb: '54-card co-operative party game. 2–6 players, 16+, 20–30 minutes.' },
      'bad-habits': { name: 'Bad Habits! Card Game', price, image: '/images/shop/bad-habits.jpg',
        blurb: '54-card co-operative family game. 2–6 players, ages 7–12, 15–20 minutes.' }
    }
  };
}

module.exports = async (req, res) => {
  const C = config();
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(C);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!C.open) return res.status(403).json({ error: 'Orders are closed right now. Please check back soon.' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Payments are not set up yet.' });

  const items = (req.body && req.body.items) || {};
  const lines = []; let decks = 0; const summary = {};
  for (const [id, p] of Object.entries(C.products)) {
    const q = Math.min(C.maxQty, num(items[id], 0));
    if (!q) continue;
    decks += q; summary[id] = q;
    lines.push({
      quantity: q,
      price_data: {
        currency: C.currency, unit_amount: p.price,
        product_data: {
          name: C.mode === 'preorder' ? `${p.name} (pre-order)` : p.name,
          description: p.blurb,
          images: [SITE() + p.image],
          metadata: { sku: id }
        }
      }
    });
  }
  if (!decks) return res.status(400).json({ error: 'Your basket is empty.' });

  const shipFree = C.freeFrom > 0 && decks >= C.freeFrom;
  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lines,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['GB'] },
      phone_number_collection: { enabled: false },
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount', display_name: shipFree ? 'Free UK delivery' : 'UK delivery (Royal Mail)',
          fixed_amount: { amount: shipFree ? 0 : C.shipping, currency: C.currency }
        }
      }],
      custom_text: { submit: { message: C.shipNote.slice(0, 1200) } },
      success_url: `${SITE()}/shop.html?order=thanks&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE()}/shop.html`,
      metadata: { order_type: C.mode === 'preorder' ? 'preorder' : 'order', items: JSON.stringify(summary), decks: String(decks) }
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('shop checkout error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
module.exports.config = config;
