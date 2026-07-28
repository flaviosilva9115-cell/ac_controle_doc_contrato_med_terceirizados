// _worker.js — Cloudflare Pages (modo avançado). Funciona com "arrastar e soltar".
// Trata /api/whoami, /api/db e /api/sienge; o resto serve os arquivos estáticos.
// O token do GitHub vem de variável de ambiente (GITHUB_TOKEN) — nunca no código.
const GH = 'https://api.github.com';

function cfg(env, pathKey) {
  return {
    owner: env.GH_OWNER,
    repo: env.GH_REPO,
    branch: env.GH_BRANCH || 'main',
    path: env[pathKey] || (pathKey === 'SIENGE_PATH' ? 'sienge-import.json' : 'db.json'),
    token: env.GITHUB_TOKEN
  };
}
function b64dec(b64) { return decodeURIComponent(escape(atob((b64 || '').replace(/\n/g, '')))); }
function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
function json(o, s) {
  return new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
async function ghGet(c) {
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${c.path}?ref=${c.branch}`,
    { headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'painel-terceirizadas' } });
  if (r.status === 404) return { sha: null, content: null };
  if (!r.ok) throw new Error('github ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  return { sha: j.sha, content: b64dec(j.content) };
}
async function ghPut(c, text, sha) {
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${c.path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'painel-terceirizadas', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'update ' + c.path + ' via painel ' + new Date().toISOString(), content: b64enc(text), branch: c.branch, sha: sha || undefined })
  });
  if (!r.ok) throw new Error('github ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    try {
      if (p === '/api/whoami') {
        const email = request.headers.get('Cf-Access-Authenticated-User-Email') || '';
        return json({ email });
      }
      if (p === '/api/db') {
        const c = cfg(env, 'GH_PATH');
        if (request.method === 'GET') { const g = await ghGet(c); return json(g.content ? JSON.parse(g.content) : {}); }
        if (request.method === 'PUT') {
          const text = await request.text(); JSON.parse(text);
          let sha = null; try { sha = (await ghGet(c)).sha; } catch (e) {}
          await ghPut(c, text, sha); return json({ ok: true });
        }
      }
      if (p === '/api/sienge') {
        const c = cfg(env, 'SIENGE_PATH');
        const g = await ghGet(c);
        if (!g.content) return json({ error: 'sienge-import.json não existe' }, 404);
        return new Response(g.content, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      }
    } catch (e) {
      return json({ error: e.message }, 500);
    }
    // Arquivos estáticos (index.html, assets, etc.)
    return env.ASSETS.fetch(request);
  }
};
