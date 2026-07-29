// /api/upload — recebe um arquivo (arraste/soltar do painel) e envia ao Google
// Drive dentro da estrutura  <raiz>/<credor>/<contrato>/<tipo(fase)>/ .
// Protegido pelo Cloudflare Access (exige e-mail autenticado). Devolve o link.
import { getAccessToken, ensurePath, uploadFile } from './_google.js';
import { json } from './_gh.js';

export async function onRequestPost({ request, env }) {
  try {
    const email = request.headers.get('Cf-Access-Authenticated-User-Email');
    if (!email) return json({ error: 'Não autenticado (Cloudflare Access).' }, 401);

    const root = env.GDRIVE_ROOT_FOLDER_ID;
    if (!root) return json({ error: 'GDRIVE_ROOT_FOLDER_ID não configurado no Cloudflare.' }, 500);

    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return json({ error: 'Arquivo ausente.' }, 400);

    const credor = String(form.get('credor') || 'Sem credor');
    const contrato = String(form.get('contrato') || 'Sem contrato');
    const tipo = String(form.get('tipo') || 'Documentos');
    const nome = String(form.get('nome') || file.name || 'documento');

    const token = await getAccessToken(env);
    const parentId = await ensurePath(token, root, [credor, contrato, tipo]);
    const bytes = await file.arrayBuffer();
    const up = await uploadFile(token, {
      name: nome, parentId, mime: file.type, bytes,
      publicLink: env.GDRIVE_PUBLIC_LINKS === '1'
    });
    return json({ ok: true, by: email, ...up });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
