// _google.js — autenticação via SERVICE ACCOUNT (JWT RS256, WebCrypto) e
// operações no Google Drive (criar pastas + upload). Roda no servidor
// (Cloudflare Pages Functions). As credenciais ficam em variáveis de ambiente
// (secrets) do Cloudflare — NUNCA no código nem no navegador.
const G = 'https://www.googleapis.com';
const COMMON = 'supportsAllDrives=true&includeItemsFromAllDrives=true';

function b64url(bytes) {
  const b = new Uint8Array(bytes); let bin = '';
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const enc = s => new TextEncoder().encode(s);
function pemToDer(pem) {
  const body = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s+/g, '');
  const bin = atob(body); const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// ---- token de acesso via service account ----
export async function getAccessToken(env) {
  const email = env.GOOGLE_SA_EMAIL;
  let key = (env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) throw new Error('Faltam GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY nas variáveis do Cloudflare.');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  };
  const unsigned = b64url(enc(JSON.stringify(header))) + '.' + b64url(enc(JSON.stringify(claim)));
  const ck = await crypto.subtle.importKey('pkcs8', pemToDer(key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', ck, enc(unsigned));
  const jwt = unsigned + '.' + b64url(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + encodeURIComponent(jwt)
  });
  if (!r.ok) throw new Error('google token ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).access_token;
}

// ---- pastas ----
async function findFolder(token, name, parentId) {
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const url = `${G}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&${COMMON}`;
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('drive list ' + r.status + ' ' + (await r.text()).slice(0, 160));
  const j = await r.json();
  return (j.files && j.files[0]) ? j.files[0].id : null;
}
async function createFolder(token, name, parentId) {
  const r = await fetch(`${G}/drive/v3/files?${COMMON}&fields=id`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] })
  });
  if (!r.ok) throw new Error('drive mkdir ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return (await r.json()).id;
}
async function ensureFolder(token, name, parentId) {
  const clean = String(name || '—').replace(/[\/\\]/g, '-').trim() || '—';
  return (await findFolder(token, clean, parentId)) || (await createFolder(token, clean, parentId));
}
export async function ensurePath(token, rootId, parts) {
  let pid = rootId;
  for (const p of parts) pid = await ensureFolder(token, p, pid);
  return pid;
}

// ---- upload ----
export async function uploadFile(token, { name, parentId, mime, bytes, publicLink }) {
  const boundary = 'ptz' + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name, parents: [parentId] });
  const pre = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: ${mime || 'application/octet-stream'}\r\n\r\n`;
  const post = `\r\n--${boundary}--`;
  const body = new Blob([pre, bytes, post]);
  const r = await fetch(`${G}/upload/drive/v3/files?uploadType=multipart&${COMMON}&fields=id,name,webViewLink`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
  if (!r.ok) throw new Error('drive upload ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  if (publicLink) {
    try {
      await fetch(`${G}/drive/v3/files/${j.id}/permissions?${COMMON}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
      });
    } catch (e) { /* segue sem link público */ }
  }
  return { id: j.id, name: j.name, url: j.webViewLink || `https://drive.google.com/file/d/${j.id}/view` };
}
