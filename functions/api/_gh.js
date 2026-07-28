// Utilidades compartilhadas para acesso ao GitHub a partir das Functions.
// O token fica em variável de ambiente (secret) no Cloudflare — nunca no código.
const GH = 'https://api.github.com';

export function cfg(env, pathKey) {
  return {
    owner: env.GH_OWNER,
    repo: env.GH_REPO,
    branch: env.GH_BRANCH || 'main',
    path: env[pathKey] || (pathKey === 'SIENGE_PATH' ? 'sienge-import.json' : 'db.json'),
    token: env.GITHUB_TOKEN
  };
}
export function b64decodeUtf8(b64) {
  return decodeURIComponent(escape(atob((b64 || '').replace(/\n/g, ''))));
}
export function b64encodeUtf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
export async function ghGet(c) {
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${c.path}?ref=${c.branch}`, {
    headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'painel-terceirizadas' }
  });
  if (r.status === 404) return { sha: null, content: null };
  if (!r.ok) throw new Error('github ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  return { sha: j.sha, content: b64decodeUtf8(j.content) };
}
export async function ghPut(c, text, sha) {
  const r = await fetch(`${GH}/repos/${c.owner}/${c.repo}/contents/${c.path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'painel-terceirizadas', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'update ' + c.path + ' via painel ' + new Date().toISOString(),
      content: b64encodeUtf8(text),
      branch: c.branch,
      sha: sha || undefined
    })
  });
  if (!r.ok) throw new Error('github ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
}
export function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
