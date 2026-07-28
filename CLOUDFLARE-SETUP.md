# Caminho B — Cloudflare Pages + Access (equipe entra só com e-mail)

Com isto, a equipe acessa o painel **só com o e-mail** (recebe um código), **ninguém digita token**, e os dados continuam **privados**. Um "porteiro" (Cloudflare Access) controla quem entra, e umas Functions no servidor guardam o token do GitHub.

```
Pessoa → Cloudflare Access (login por e-mail) → Painel (Cloudflare Pages) → Functions (guardam o token) → repo privado (db.json)
```

O mesmo código funciona nos dois lugares: no Cloudflare (modo servidor, login por e-mail) e no GitHub Pages (modo token, como antes). Ele detecta sozinho onde está.

## Pré-requisitos

- O repositório **público** do painel (o `ac_controledoc_terceirizadas`), já com a pasta `functions/` (vem no pacote v7).
- O repositório **privado** do banco (`ac_controledoc_db`), onde ficam `db.json` e `sienge-import.json`.
- Um **token fine-grained** com **Contents: Read and write** no repositório privado (pode reusar o que você já criou, ou criar um novo só para o Cloudflare).

## Passo 1 — Publicar no Cloudflare Pages

1. Crie uma conta grátis em cloudflare.com.
2. No painel do Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
3. Autorize o GitHub e escolha o repositório **público** do painel.
4. Build settings: **Framework preset: None**, **Build command: (vazio)**, **Build output directory: `/`**. Salvar e implantar.
5. Ao final, você recebe uma URL tipo `https://ac-controledoc.pages.dev`. As Functions em `functions/api/*` já funcionam automaticamente.

## Passo 2 — Variáveis de ambiente (o token do servidor)

No projeto Pages: **Settings → Environment variables → Production** → adicione:

| Nome | Valor | Tipo |
|---|---|---|
| `GITHUB_TOKEN` | seu token fine-grained | **Encrypt/Secret** |
| `GH_OWNER` | `flaviosilva9115-cell` | texto |
| `GH_REPO` | `ac_controledoc_db` | texto |
| `GH_BRANCH` | `main` | texto |
| `GH_PATH` | `db.json` | texto |
| `SIENGE_PATH` | `sienge-import.json` | texto |

Depois de salvar, faça um novo deploy (Deployments → Retry deployment) para as variáveis valerem.

## Passo 3 — Ligar o Cloudflare Access (o porteiro) — OBRIGATÓRIO

Sem isto, as Functions ficam abertas na internet. Faça antes de compartilhar a URL.

1. No Cloudflare: **Zero Trust** (aceite o plano **Free**, até 50 usuários).
2. **Access → Applications → Add an application → Self-hosted**.
3. **Application domain**: o domínio do seu Pages (`ac-controledoc.pages.dev`).
4. **Identity / login methods**: deixe **One-time PIN** ligado (login por e-mail, sem precisar de Google/Microsoft).
5. **Policies → Add a policy**:
   - Nome: `Equipe`.
   - Action: **Allow**.
   - Include → **Emails** → liste os e-mails autorizados (o seu e o da equipe). *(Dá para usar "Emails ending in @suaempresa.com" se todos tiverem o mesmo domínio.)*
6. Salvar. A partir daí, só esses e-mails entram — cada um digitando o próprio e-mail e o código recebido.

## Passo 4 — Primeiro acesso

1. Abra a URL do Pages, entre com **o seu e-mail**. Como você é o primeiro, o painel te cria **como administrador** automaticamente.
2. Para cada colega: **(a)** adicione o e-mail dele na política do Access (Passo 3) e **(b)** quando ele entrar pela primeira vez, ele é criado como usuário comum sem obras — então você vai em **Configurações → Usuários**, abre o usuário dele e libera as **obras** (e marca "Administrador" se for o caso).
3. Compartilhe **só a URL do Cloudflare** com a equipe. Pode até desligar o GitHub Pages, se quiser.

## Como funciona por baixo

- `functions/api/whoami.js` — devolve o e-mail que o Access autenticou; o painel usa para logar sozinho.
- `functions/api/db.js` — lê/grava o `db.json` no repo privado usando o `GITHUB_TOKEN` do servidor.
- `functions/api/sienge.js` — lê o `sienge-import.json`.
- O token **nunca** chega ao navegador; fica só nas variáveis do Cloudflare.

> Segurança: mantenha o Access ligado no domínio inteiro (inclui `/api/*`). Sem Access, qualquer pessoa com a URL acessaria os dados.
