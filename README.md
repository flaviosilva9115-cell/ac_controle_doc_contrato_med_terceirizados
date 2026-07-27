# Painel de Controle de Documentos de Terceirizadas

Painel web para controlar a documentação das empresas terceirizadas em **diversas obras**, garantindo a **liberação de entrada no canteiro** (por colaborador) e a **liberação da medição/pagamento** (por contrato/mês), com emissão de **boletins**.

- **100% estático** — roda no **GitHub Pages**, sem servidor e sem custo.
- **Banco de dados** = um arquivo JSON. Fica no navegador por padrão e pode ser **sincronizado de graça** com um `db.json` em um repositório **privado** (banco compartilhado entre usuários, protegido por token).
- Identidade visual **Amorim Coutinho**; estrutura de telas inspirada no padrão Mentor Construção.
- Regra de negócio baseada na planilha **Rev 08 – Tipos de Contratos e Documentação Exigida** (matriz **26 tipos de contrato × 59 documentos**), já embarcada em `assets/js/seed.js`.

## Arquitetura no plano gratuito (importante)

No GitHub Free, o Pages **só publica a partir de repositório público**, e o site publicado é sempre acessível por link. Por isso separamos:

- **Repositório A — público:** contém **apenas o app** (estes arquivos). É o que vira o site no GitHub Pages. Não guarda nenhum dado sensível — só o código e o catálogo de tipos de documento.
- **Repositório B — privado:** contém **apenas o `db.json`** (o banco: obras, terceirizadas, contratos, colaboradores, documentos). O app lê/grava esse arquivo via GitHub API usando um token. Sem o token, ninguém acessa os dados.

Assim o link do painel é público (é só a casca), mas **os dados ficam protegidos** no repositório privado.

## Passo a passo — publicar o app (Repositório A)

1. Crie uma conta e entre no GitHub.
2. **New repository** → nome `painel-terceirizadas` → visibilidade **Public** → Create.
3. **Add file → Upload files** → extraia o .zip e arraste **os arquivos de dentro** da pasta `painel-terceirizadas` (o `index.html` deve ficar na raiz do repositório). Os caminhos `assets/...`, `.github/...` e o `.nojekyll` são preservados. **Commit changes**.
4. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `/ (root)` → Save.**
   *(O arquivo `.nojekyll` já vem incluído para o site subir corretamente.)*
5. Aguarde ~1 minuto e abra a URL mostrada em Settings → Pages (algo como `https://SEU-USUARIO.github.io/painel-terceirizadas/`).
6. Login padrão: **admin / admin** (troque depois — veja "Segurança").

## Passo a passo — banco compartilhado (Repositório B, opcional e grátis)

Sem isto, cada navegador guarda seus próprios dados. Para compartilhar entre a equipe:

1. Crie um segundo repositório, **Private**, ex.: `painel-terceirizadas-db`.
2. Crie nele um arquivo `db.json` com o conteúdo `{}` (ou exporte pelo painel em Configurações → Exportar JSON e suba esse arquivo).
3. Gere um **fine-grained token** (Settings da conta → Developer settings → Personal access tokens → Fine-grained) restrito a **esse repositório**, com permissão **Contents: Read and write**.
4. No painel: **Configurações → Sincronização GitHub** → owner, repo `painel-terceirizadas-db`, branch `main`, caminho `db.json`, cole o token → **Salvar config**.
5. Use **Enviar para o GitHub** (grava) e **Baixar do GitHub** (lê). O botão **⟳ Sinc** no topo envia rápido. O token fica só na sessão.

## Segurança

- O login do painel é apenas uma tela client-side — não é um muro de verdade, porque o site é público no plano gratuito.
- A proteção real dos dados vem do **repositório privado do `db.json` + token**: sem token, não há acesso aos dados.
- Para um muro de login de verdade **e** gratuito na frente do site, dá para colocar o **Cloudflare Access (Zero Trust)** na frente do GitHub Pages (plano free cobre uma equipe pequena).
- Troque o usuário/senha padrão editando a lista `usuarios` em `assets/js/app.js` (dado inicial) ou pela tela futura de usuários.

## Estrutura

```
index.html
assets/css/styles.css
assets/js/
  seed.js     # matriz 26x59 (gerada da planilha) — nao editar a mao
  store.js    # banco JSON: localStorage + sync GitHub + export/import
  logic.js    # situacao/status, checklist da matriz, portoes, boletins
  ui.js       # casca (logo AC, sidebar, roteador, componentes)
  views.js    # telas (dashboard, cadastros, docs do contrato, boletins, config)
  app.js      # login + inicializacao + dados de exemplo
.github/workflows/pages.yml   # deploy opcional via GitHub Actions
.nojekyll
```

## Primeiros passos

Em **Configurações → Carregar dados de exemplo** você popula obras, uma terceirizada, um contrato e colaboradores para explorar o fluxo.

## Novidades v2

- **Usuários com e-mail e senha** (Configurações → Usuários), com acesso a **todas as obras** ou a **obras específicas**. Todo o painel (painel geral, obras, contratos, boletins) passa a respeitar o escopo de obras do usuário logado.
- **Abrir e fechar períodos** (menu Períodos). Período fechado trava a inclusão/edição de documentos periódicos e o lançamento da medição daquele mês.
- **Catálogos editáveis** (Configurações): criar/editar **Tipos de Contrato**, **Tipos de Documento** (inclusive definindo em quais contratos cada documento é exigido — a matriz) e **Colaboradores**.

### Login
O login agora aceita **e-mail ou usuário**. Padrão inicial: `admin` / `admin` — crie os demais usuários em Configurações → Usuários.

## Novidades v3

- **Cores Amorim Coutinho** no lugar do preto: topbar vermelho, menu claro com destaque vermelho.
- **Filtros dinâmicos** (filtram ao digitar) em Obras, Terceirizadas, Contratos (busca + obra + status da documentação), Períodos, e filtro por **obra** nos Boletins.
- **Boletim de Medição** deixa claro que os documentos periódicos **anexados e validados no período** entram automaticamente; mostra quem inseriu e o status do período.
- Botão **"Aprovar todos (empresa)"** na tela de Documentos do Contrato — marca a documentação da empresa como **Completa** mesmo com pendências.
- Colaborador só é **liberado para entrada** quando todos os seus documentos estão anexados, válidos e **aprovados** pelo setor responsável (SESMT/DP).
