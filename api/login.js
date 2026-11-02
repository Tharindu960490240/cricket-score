// POST /api/login {password} -> {token}  (password = ADMIN_PASSWORD env var; tokens last 30 days)
const crypto = require('crypto');
const { secret, makeToken, body } = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  if (!secret()) return res.status(503).json({ error: 'no-admin-password' });
  const given = crypto.createHash('sha256').update(String(body(req).password || '')).digest();
  const real = crypto.createHash('sha256').update(secret()).digest();
  if (!crypto.timingSafeEqual(given, real)) {
    await new Promise((r) => setTimeout(r, 800));
    return res.status(401).json({ error: 'wrong-password' });
  }
  return res.status(200).json({ token: makeToken() });
};
