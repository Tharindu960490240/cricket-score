// GET    /api/state            -> {index:[{id,name,updated}], latest}   (public)
// GET    /api/state?t=ID       -> {data:{T}, updated}                    (public, cached 2s at the edge)
// POST   /api/state {t, data}  -> save a tournament                      (admin)
// DELETE /api/state?t=ID       -> delete a tournament                    (admin)
const { redis, configured, checkToken, body } = require('./_lib');
const clean = (s) => String(s || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
const readIndex = async () => JSON.parse((await redis('GET', 'cricket:index')) || '[]');

module.exports = async (req, res) => {
  if (!configured()) { res.setHeader('Cache-Control', 'no-store'); return res.status(503).json({ error: 'storage-not-configured' }); }
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', req.query.fresh ? 'no-store' : 'public, max-age=0, s-maxage=2, stale-while-revalidate=4');
      const t = clean(req.query.t);
      if (!t) { const index = await readIndex(); return res.status(200).json({ index, latest: index[0] ? index[0].id : null }); }
      const v = await redis('GET', 'cricket:t:' + t);
      if (!v) return res.status(404).json({ error: 'not-found' });
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(v);
    }
    res.setHeader('Cache-Control', 'no-store');
    if (!checkToken(req)) return res.status(401).json({ error: 'login-required' });
    if (req.method === 'POST') {
      const b = body(req); const t = clean(b.t);
      if (!t || !b.data || !b.data.T) return res.status(400).json({ error: 'bad-request' });
      const updated = Date.now();
      const value = JSON.stringify({ data: b.data, updated });
      if (value.length > 4e6) return res.status(413).json({ error: 'too-large' });
      await redis('SET', 'cricket:t:' + t, value);
      const index = (await readIndex()).filter((x) => x.id !== t);
      index.unshift({ id: t, name: String(b.data.T.name || 'Tournament').slice(0, 80), updated });
      await redis('SET', 'cricket:index', JSON.stringify(index.slice(0, 50)));
      return res.status(200).json({ ok: true, updated });
    }
    if (req.method === 'DELETE') {
      const t = clean(req.query.t);
      await redis('DEL', 'cricket:t:' + t);
      await redis('SET', 'cricket:index', JSON.stringify((await readIndex()).filter((x) => x.id !== t)));
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: 'storage-error' });
  }
};
