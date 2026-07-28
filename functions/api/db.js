// /api/db — lê (GET) e grava (PUT) o db.json no repositório privado do GitHub,
// usando o token guardado no servidor (Cloudflare). Protegido pelo Cloudflare Access.
import { cfg, ghGet, ghPut, json } from './_gh.js';

export async function onRequestGet({ env }) {
  try {
    const c = cfg(env, 'GH_PATH');
    const g = await ghGet(c);
    return json(g.content ? JSON.parse(g.content) : {});
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const c = cfg(env, 'GH_PATH');
    const text = await request.text();
    // valida JSON antes de gravar
    JSON.parse(text);
    let sha = null;
    try { sha = (await ghGet(c)).sha; } catch (e) { /* arquivo ainda não existe */ }
    await ghPut(c, text, sha);
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
