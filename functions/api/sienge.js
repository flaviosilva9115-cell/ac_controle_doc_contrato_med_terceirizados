// /api/sienge — devolve o sienge-import.json do repositório privado (só leitura).
import { cfg, ghGet, json } from './_gh.js';

export async function onRequestGet({ env }) {
  try {
    const c = cfg(env, 'SIENGE_PATH');
    const g = await ghGet(c);
    if (!g.content) return json({ error: 'sienge-import.json não existe' }, 404);
    return new Response(g.content, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
