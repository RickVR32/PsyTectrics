/* One function, many small routes (Vercel Hobby allows 12 functions per project).
   vercel.json rewrites /api/decode, /api/ask, /api/reviews, /api/save-test-result and
   /api/profile-report here, so the site's URLs stay the same. */
const ROUTES = {
  'decode': () => require('../lib/routes/decode'),
  'ask': () => require('../lib/routes/ask'),
  'reviews': () => require('../lib/routes/reviews'),
  'save-test-result': () => require('../lib/routes/save-test-result'),
  'profile-report': () => require('../lib/routes/profile-report')
};
module.exports = async (req, res) => {
  const r = String((req.query && req.query.r) || '');
  const load = ROUTES[r];
  if (!load) return res.status(404).json({ error: 'Not found' });
  return load()(req, res);
};
