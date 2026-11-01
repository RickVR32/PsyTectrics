/* Reviews: GET = approved reviews for the site. POST = new review, held as "pending"
   until Rick taps Approve in Telegram. Free/discounted reviews are labelled on the site (CMA/DMCC rules). */
const { createClient } = require('@supabase/supabase-js');
const tg = require('../tg');
const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

module.exports = async (req, res) => {
  const s = db();
  if (req.method === 'GET') {
    const { data, error } = await s.from('reviews').select('name,rating,text,incentivised,source,created_at')
      .eq('status', 'approved').order('created_at', { ascending: false }).limit(12);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(error ? 500 : 200).json({ reviews: data || [] });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, rating, text, incentivised, website, product } = req.body || {};
  if (website) return res.status(200).json({ ok: true }); // honeypot
  const r = Math.round(+rating);
  const body = String(text || '').trim();
  if (!(r >= 1 && r <= 5) || body.length < 10) return res.status(400).json({ error: 'Please pick a star rating and write at least a sentence.' });
  const row = { name: String(name || 'Anonymous').trim().slice(0, 40) || 'Anonymous', rating: r, text: body.slice(0, 600),
    incentivised: incentivised === true, product: String(product || 'Awareness Profile').slice(0, 40), source: 'site', status: 'pending' };
  const { data: rv, error } = await s.from('reviews').insert(row).select().single();
  if (error) { console.error('review insert', error); return res.status(500).json({ error: 'Could not save your review. Please try again.' }); }
  await tg.admin(`⭐ New review (${'⭐'.repeat(rv.rating)}) from ${tg.esc(rv.name)} via site${rv.incentivised ? ' — <b>free/discounted</b>' : ''}:\n\n"${tg.esc(rv.text)}"`,
    [[{ text: '✅ Approve — post to site', callback_data: `rv:ok:${rv.id}` }, { text: '🗑 Reject', callback_data: `rv:no:${rv.id}` }]]);
  return res.status(200).json({ ok: true });
};
