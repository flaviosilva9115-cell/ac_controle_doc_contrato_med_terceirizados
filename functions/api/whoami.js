// /api/whoami — devolve o e-mail autenticado pelo Cloudflare Access.
// O painel usa isso para logar automaticamente, sem senha nem token.
export async function onRequestGet(context) {
  const email = context.request.headers.get('Cf-Access-Authenticated-User-Email') || '';
  return new Response(JSON.stringify({ email }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
