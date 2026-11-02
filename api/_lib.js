// Shared helpers. Files starting with "_" are not turned into API routes by Vercel.
const crypto = require('crypto');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...args) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const secret = () => process.env.ADMIN_PASSWORD || '';
const sign = (exp) => crypto.createHmac('sha256', secret()).update('cricket-admin:' + exp).digest('hex');
function makeToken(days = 30) { const exp = Date.now() + days * 864e5; return exp + '.' + sign(exp); }
function checkToken(req) {
  if (!secret()) return false;
  const t = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const [exp, sig] = t.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}
const body = (req) => (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {});
module.exports = { redis, configured: () => !!(URL_ && TOKEN), secret, makeToken, checkToken, body };
