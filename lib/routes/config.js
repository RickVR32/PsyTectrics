/* Public settings the browser needs for sign-in. The anon/publishable key is designed to be public;
   row-level security keeps every table closed to it. */
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300');
  res.status(200).json({ supabaseUrl: process.env.SUPABASE_URL || null, supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null });
};
