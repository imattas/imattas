/* Cloudflare Worker: live Hack The Box stats proxy.
 *
 * Why this exists: HTB's API needs a Bearer App Token and sends no CORS headers,
 * so the browser can't call it, and the token must never ship in a public static
 * site. This Worker holds the token as a secret, calls HTB server-side, and
 * returns CORS-enabled JSON the portfolio can fetch live on every visit, with no
 * GitHub Actions run involved.
 *
 * Deploy (one time):
 *   npm i -g wrangler
 *   cd worker && wrangler deploy
 *   wrangler secret put HTB_TOKEN      # paste your HTB App Token
 *   wrangler secret put HTB_USER_ID    # optional (else resolved from the token)
 *
 * Routed by ../index.js at /htb and /hackthebox. Point HTB_PROXY in your
 * portfolio's main.js at https://<name>.<account>.workers.dev/hackthebox.
 *
 * Responses are edge-cached for 5 minutes so visitor traffic never hammers HTB.
 */
const API = 'https://labs.hackthebox.com/api/v4';

export async function handleHtb(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=300'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'GET') return json({ ok: false, error: 'method not allowed' }, cors, 405);

    // serve a fresh edge-cached copy if we have one (protects HTB rate limits)
    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;

    let token = env.HTB_TOKEN || '';
    if (token.charCodeAt(0) === 0xFEFF) token = token.slice(1);   // strip BOM
    token = token.trim();
    if (!token) return json({ ok: false, error: 'HTB_TOKEN secret not set' }, cors, 500);
    const h = {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'application/json'
    };

    try {
      let id = env.HTB_USER_ID;
      if (!id) {
        const info = await (await fetch(`${API}/user/info`, { headers: h })).json();
        id = info?.info?.id;
        if (!id) throw new Error('could not resolve user id from token');
      }

      const basic = await (await fetch(`${API}/user/profile/basic/${id}`, { headers: h })).json();
      const b = basic?.profile;
      if (!b) throw new Error('no profile in response');

      let challenges = null, categories = [];
      try {
        const ch = await (await fetch(`${API}/user/profile/progress/challenges/${id}`, { headers: h })).json();
        const cp = ch?.profile;
        if (cp?.challenge_owns) {
          challenges = {
            solved: cp.challenge_owns.solved, total: cp.challenge_owns.total,
            percentage: cp.challenge_owns.percentage
          };
        }
        categories = (cp?.challenge_categories || []).map(c => ({
          name: c.name, owned: c.owned_flags, total: c.total_flags
        }));
      } catch (_) { /* challenge progress is optional */ }

      const body = {
        ok: true,
        name: b.name, rank: b.rank, rank_id: b.rank_id,
        rank_progress: b.current_rank_progress, next_rank: b.next_rank,
        ranking: b.ranking, points: b.points,
        user_owns: b.user_owns, system_owns: b.system_owns,
        respects: b.respects, country: b.country_name, joined: b.joined_date,
        challenges, categories,
        synced: new Date().toISOString()
      };

      const res = json(body, cors);
      ctx.waitUntil(cache.put(request, res.clone()));
      return res;
    } catch (err) {
      return json({ ok: false, error: String(err && err.message || err) }, cors, 502);
    }
  }

function json(obj, cors, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors }
  });
}