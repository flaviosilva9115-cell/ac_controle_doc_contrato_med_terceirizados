# Backend do painel — Cloudflare Pages + Access + Google Drive

Este guia liga o **modo servidor** do painel:

- **Login por e-mail** (Cloudflare Access) — a equipe entra só com o e-mail, sem token, sem senha.
- **Banco compartilhado** — o `db.json` fica num repositório **privado** do GitHub; o token de acesso mora no servidor (Cloudflare), nunca no navegador.
- **Anexos no Google Drive** — ao arrastar um arquivo no painel, uma Function envia direto ao Drive na estrutura `raiz / credor / contrato / tipo(fase)` usando uma **service account** (sem o usuário configurar nada).

O **mesmo código** roda nos dois modos: no GitHub Pages ele funciona no modo estático (token no dispositivo); publicado no Cloudflare Pages, ele detecta o servidor sozinho (via `/api/whoami`) e passa a login por e-mail + upload ao Drive.

> Free tier: Cloudflare Access é gratuito até **50 usuários**.

---

## Pré-requisitos
- Node.js instalado (para rodar o `npx wrangler`).
- Conta Google (Google Cloud) e conta Cloudflare (com Zero Trust habilitado — é grátis).
- O repositório **privado** do banco já criado (ex.: `ac_controledoc_db`) e um **token fine-grained** do GitHub com permissão **Contents: Read and write** nele.

---

## Passo 1 — Service account no Google Cloud
1. Acesse https://console.cloud.google.com e crie (ou escolha) um projeto.
2. **APIs & Services → Library →** procure **Google Drive API →** *Enable*.
3. **APIs & Services → Credentials → Create credentials → Service account.** Dê um nome (ex.: `painel-terceirizadas`) e crie.
4. Abra a service account criada → aba **Keys → Add key → Create new key → JSON.** Baixe o arquivo `.json`.
5. Desse JSON você vai usar dois campos:
   - `client_email`  → vira a variável **GOOGLE_SA_EMAIL**
   - `private_key`   → vira a variável **GOOGLE_SA_PRIVATE_KEY** (o texto inteiro, com `-----BEGIN PRIVATE KEY-----` … `-----END PRIVATE KEY-----`)

## Passo 2 — Pasta raiz no Google Drive
1. No seu Google Drive, crie uma pasta (ex.: **"Documentos Terceirizadas"**).
2. **Compartilhe** essa pasta com o **client_email** da service account, como **Editor**.
   - Dica: se usar um **Shared Drive**, adicione a service account como membro **Content manager** — funciona igual (o código já usa `supportsAllDrives`).
3. Abra a pasta e copie o **ID** que aparece na URL:
   `https://drive.google.com/drive/folders/`**`ESTE_ID`** → vira **GDRIVE_ROOT_FOLDER_ID**.

## Passo 3 — Publicar no Cloudflare Pages (Wrangler CLI)
> Use o Wrangler CLI (upload direto). **Não** use o "drag-drop" do dashboard novo — ele cria um *Worker* e as Functions/variáveis não funcionam.

Na pasta do projeto:
```bash
npx wrangler login
npx wrangler pages project create ac-controledoc-terceirizadas --production-branch main
npx wrangler pages deploy .
```
Ao final, anote a URL gerada: `https://ac-controledoc-terceirizadas.pages.dev`.

## Passo 4 — Variáveis e segredos no Cloudflare
No painel do Cloudflare: **Workers & Pages → ac-controledoc-terceirizadas → Settings → Variables and Secrets** (ou via CLI, abaixo). Cadastre:

| Nome | Tipo | Valor |
|---|---|---|
| `GITHUB_TOKEN` | **Secret** | token fine-grained (Contents R/W) do repo privado do banco |
| `GH_OWNER` | Texto | seu usuário/org do GitHub |
| `GH_REPO` | Texto | nome do repo privado do banco (ex.: `ac_controledoc_db`) |
| `GH_BRANCH` | Texto | `main` |
| `GH_PATH` | Texto | `db.json` |
| `SIENGE_PATH` | Texto | `sienge-import.json` |
| `GOOGLE_SA_EMAIL` | Texto | `client_email` do JSON |
| `GOOGLE_SA_PRIVATE_KEY` | **Secret** | `private_key` do JSON (texto inteiro) |
| `GDRIVE_ROOT_FOLDER_ID` | Texto | ID da pasta raiz do Passo 2 |
| `GDRIVE_PUBLIC_LINKS` | Texto | `0` (padrão) ou `1` para gerar link "qualquer pessoa com o link" |

Pelo CLI, os segredos podem ir assim (cole o valor quando pedir):
```bash
npx wrangler pages secret put GITHUB_TOKEN
npx wrangler pages secret put GOOGLE_SA_PRIVATE_KEY
```
> A chave privada pode ser colada com quebras de linha reais **ou** com `\n` — o código trata os dois casos.

Depois de cadastrar as variáveis, **rode `npx wrangler pages deploy .` de novo** para elas entrarem em vigor.

## Passo 5 — LIGAR o Cloudflare Access (obrigatório)
Sem isso, `/api/whoami` volta vazio e qualquer pessoa acessaria o painel.
1. **Zero Trust → Access → Applications → Add an application → Self-hosted.**
2. Domínio: a URL do Pages (`ac-controledoc-terceirizadas.pages.dev`) ou seu domínio próprio.
3. **Policy:** *Allow* → por e-mails específicos ou por domínio de e-mail da empresa (ex.: `@amorimcoutinho.com.br`).
4. Método de login: Google/One-time PIN.
5. Salve. A partir daí, abrir o painel pede o e-mail e valida pelo Access.

## Passo 6 — Primeiro acesso
- O **primeiro e-mail** que entrar vira **admin** automaticamente (bootstrap).
- Os demais entram como usuários comuns **sem obras** — o admin libera as obras de cada um em **Configurações → Usuários**.

---

## Como funciona o upload ao Drive
- Ao anexar um documento (botão **＋** na tela *Documentos do Contrato*), no modo servidor aparece uma área **"Arraste o arquivo aqui"**.
- O arquivo é enviado à Function `/api/upload`, que cria (se não existir) a estrutura de pastas **`raiz / <credor> / CT <número> / <fase>`** e faz o upload.
- O **link** do arquivo volta preenchido no campo do anexo e é salvo junto do documento.
- Se `GDRIVE_PUBLIC_LINKS=1`, o link fica acessível a qualquer pessoa que o tenha; com `0` (padrão), só quem tem acesso à pasta abre.

## Observações honestas
- Este backend **não pôde ser testado contra o Google/Cloudflare reais** aqui (sem credenciais/rede). O código foi validado em sintaxe e lógica; pode precisar de **1 pequeno ajuste no 1º run** (ex.: formato da chave privada ou permissão da pasta). As Functions retornam a mensagem de erro do Google/GitHub em JSON, o que facilita o diagnóstico.
- A service account precisa **mesmo** ter acesso de edição à pasta raiz (Passo 2), senão o upload falha com erro de permissão.
- Continua valendo o modo estático (GitHub Pages) como alternativa: lá não há upload automático ao Drive; usa-se o campo de link manual.
