/* =====================================================================
   Painel de Controle de Documentos de Terceirizadas
   Identidade visual: Amorim Coutinho (vermelho #941616 / cinza #717172)
   Estrutura/UX: padrão Mentor Construção (filtros, tabelas, badges)
   Sem dependências externas. Roda em GitHub Pages.
   ===================================================================== */
:root{
  --ac-red:#941616; --ac-red-dark:#7a1212; --ac-gray:#717172;
  --dark:#1c1c1e; --dark-2:#26262a; --bg:#f0f0f0;
  --line:#e2e2e5; --lav:#eceef6; --text:#20232a; --muted:#6b7280;
  /* semânticas (situação/status) */
  --ok:#2e9e5b; --ok-bg:#e4f5ea;
  --err:#d33a3a; --err-bg:#fbe6e6;
  --warn:#e0a90c; --warn-bg:#fcf3d6;
  --pend:#8b5cf6; --pend-bg:#efeafe;
  --part:#2f8fd6; --part-bg:#e3f1fb;
  --radius:10px; --shadow:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.04);
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{font-family:Arial,"Segoe UI",system-ui,sans-serif;background:var(--bg);color:var(--text);font-size:14px}
button{font-family:inherit;cursor:pointer}
a{color:var(--ac-red);text-decoration:none}
.hidden{display:none!important}

/* ---------- LOGIN (split screen padrão AC) ---------- */
#login{position:fixed;inset:0;display:flex;background:#fff;z-index:50}
.login-hero{flex:1;background:var(--ac-red);color:#fff;position:relative;overflow:hidden;
  padding:56px;display:flex;flex-direction:column;justify-content:center}
.login-hero::before,.login-hero::after{content:"";position:absolute;border-radius:50%;
  background:rgba(255,255,255,.06)}
.login-hero::before{width:420px;height:420px;top:-140px;right:-120px}
.login-hero::after{width:300px;height:300px;bottom:-120px;left:-80px}
.login-hero .brand-name{font:900 40px Arial;letter-spacing:1px;position:relative}
.login-hero .brand-sub{opacity:.85;letter-spacing:4px;font-size:11px;margin-top:4px;position:relative}
.login-hero .slogan{font-style:italic;opacity:.9;margin:14px 0 26px;position:relative}
.mvv{position:relative;font-size:12.5px;line-height:1.55;max-width:520px}
.mvv h4{margin:14px 0 4px;font-size:12px;letter-spacing:1px;opacity:.9}
.mvv ul{margin:4px 0 0 16px;padding:0}
.login-foot{position:absolute;bottom:22px;left:56px;right:56px;font-size:11px;opacity:.75}
.login-box{width:420px;padding:56px 48px;display:flex;flex-direction:column;justify-content:center}
.login-box .logo{display:flex;align-items:center;gap:12px;margin-bottom:28px}
.login-box .logo .wm{width:46px;height:46px}
.login-box .logo .txt{font:900 20px Arial;line-height:1}
.login-box .logo .txt .a{color:var(--ac-red)} .login-box .logo .txt .c{color:var(--ac-gray)}
.login-box .logo .txt small{display:block;font:400 8px Arial;letter-spacing:2px;color:var(--ac-gray)}
.login-box label{font-size:12px;color:var(--muted);margin:12px 0 4px;display:block}
.login-box input{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px}
.login-box .btn-primary{margin-top:20px;width:100%;justify-content:center}
.login-hint{font-size:11px;color:var(--muted);margin-top:14px;text-align:center}

/* ---------- APP SHELL ---------- */
#app{display:none;min-height:100vh}
.topbar{height:56px;background:var(--ac-red);color:#fff;display:flex;align-items:center;
  gap:14px;padding:0 16px;position:sticky;top:0;z-index:30;box-shadow:0 1px 4px rgba(0,0,0,.12)}
.topbar .wm{width:30px;height:30px}
.topbar .brand{font:900 15px Arial;letter-spacing:.5px}
.topbar .brand small{display:block;font:400 8px Arial;letter-spacing:2px;color:#f4d4d4}
.topbar .spacer{flex:1}
.topbar .who{font-size:12px;color:rgba(255,255,255,.9)}
.topbar .icon-btn{background:transparent;border:0;color:rgba(255,255,255,.92);font-size:13px;padding:6px 8px;border-radius:6px}
.topbar .icon-btn:hover{background:rgba(255,255,255,.16);color:#fff}
.layout{display:flex;align-items:flex-start}
.sidebar{width:236px;min-height:calc(100vh - 56px);background:#fff;flex-shrink:0;padding:10px 0;border-right:1px solid var(--line)}
.sidebar .nav-item{display:flex;align-items:center;gap:10px;color:#4a4a4c;padding:11px 18px;
  font-size:13px;border-left:3px solid transparent;cursor:pointer}
.sidebar .nav-item .ic{width:18px;text-align:center;opacity:.9}
.sidebar .nav-item:hover{background:#f4f4f6;color:#1a1a1a}
.sidebar .nav-item.active{background:#fbecec;border-left-color:var(--ac-red);color:var(--ac-red);font-weight:700}
.sidebar .nav-sep{color:#a2a2a6;font-size:10px;letter-spacing:1px;padding:14px 18px 6px}
.main{flex:1;padding:22px 26px;min-width:0}

/* ---------- PAGE HEADER (padrão Mentor) ---------- */
.page-head{display:flex;align-items:center;gap:12px;margin-bottom:4px}
.page-head .pic{width:40px;height:40px;background:var(--ac-red);color:#fff;border-radius:8px;
  display:flex;align-items:center;justify-content:center;font-size:18px}
.page-head h1{font-size:20px;margin:0;flex:1}
.page-head .actions{display:flex;gap:8px}
.page-rule{height:2px;background:var(--ac-red);opacity:.85;margin:10px 0 18px;border-radius:2px}

/* ---------- BOTÕES ---------- */
.btn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:#fff;
  color:var(--text);padding:9px 14px;border-radius:8px;font-size:13px;font-weight:600}
.btn:hover{background:#f6f6f8}
.btn-primary{background:var(--ac-red);border-color:var(--ac-red);color:#fff}
.btn-primary:hover{background:var(--ac-red-dark)}
.btn-dark{background:var(--ac-gray);border-color:var(--ac-gray);color:#fff}
.btn-dark:hover{filter:brightness(.94)}
.btn-ghost{background:transparent;border-color:transparent;color:var(--muted)}
.btn-sm{padding:6px 10px;font-size:12px}
.icon-act{width:30px;height:30px;border-radius:6px;border:0;display:inline-flex;align-items:center;
  justify-content:center;color:#fff;font-size:12px;margin-left:4px}
.icon-act.edit{background:var(--ac-gray)} .icon-act.del{background:var(--err)}
.icon-act.folder{background:#caa53a} .icon-act.ok{background:var(--ok)} .icon-act.view{background:var(--ac-gray)}
.icon-act:hover{filter:brightness(1.08)}

/* ---------- CARDS / FILTRO ---------- */
.card{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:18px;overflow:hidden}
.filter-head{background:var(--ac-gray);color:#fff;padding:11px 16px;font-size:13px;font-weight:700;
  display:flex;align-items:center;gap:8px}
.filter-body{padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
.filter-body .field{display:flex;flex-direction:column}
.field label{font-size:11px;color:var(--muted);letter-spacing:.4px;margin-bottom:5px;text-transform:uppercase}
.field input,.field select,.field textarea{padding:9px 11px;border:1px solid var(--line);border-radius:8px;font-size:13.5px;background:#fff}
.field textarea{resize:vertical;min-height:64px}
.card-title{padding:12px 16px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line)}
.flt{padding:8px 11px;border:1px solid var(--line);border-radius:8px;font-size:13px;min-width:240px;font-family:inherit}

/* ---------- TABELAS (cabeçalho lavanda Mentor) ---------- */
.tbl-wrap{overflow-x:auto}
table.tbl{width:100%;border-collapse:collapse;font-size:13px}
table.tbl thead th{background:var(--lav);color:#3b3f4a;text-align:left;padding:11px 12px;
  font-size:11px;letter-spacing:.4px;text-transform:uppercase;border-bottom:2px solid #d7dae8;white-space:nowrap}
table.tbl tbody td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:middle}
table.tbl tbody tr:hover{background:#fafafc}
table.tbl .num{color:var(--ac-red);font-weight:700}
.empty{padding:26px;text-align:center;color:var(--muted);font-style:italic}
.tbl-foot{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px;color:var(--muted);font-size:12px}

/* ---------- BADGES (situação + status) ---------- */
.badge{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:700;white-space:nowrap}
.badge .dot{width:8px;height:8px;border-radius:50%}
.b-ok{background:var(--ok-bg);color:#1c7a41} .b-ok .dot{background:var(--ok)}
.b-err{background:var(--err-bg);color:#a12222} .b-err .dot{background:var(--err)}
.b-warn{background:var(--warn-bg);color:#8a6608} .b-warn .dot{background:var(--warn)}
.b-pend{background:var(--pend-bg);color:#6d28d9} .b-pend .dot{background:var(--pend)}
.b-part{background:var(--part-bg);color:#1f6fa8} .b-part .dot{background:var(--part)}
.b-muted{background:#eceef0;color:#6b7280} .b-muted .dot{background:#9aa0a6}

/* ---------- DASHBOARD ---------- */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:18px}
.kpi{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);padding:16px 18px;border-left:4px solid var(--ac-gray)}
.kpi.k-red{border-left-color:var(--ac-red)} .kpi.k-ok{border-left-color:var(--ok)}
.kpi.k-warn{border-left-color:var(--warn)} .kpi.k-err{border-left-color:var(--err)}
.kpi .v{font-size:28px;font-weight:800;line-height:1}
.kpi .l{font-size:12px;color:var(--muted);margin-top:6px}
.bar{height:9px;background:#eceef0;border-radius:6px;overflow:hidden;margin-top:8px}
.bar > i{display:block;height:100%;background:var(--ok)}

/* ---------- TABS (Documentos do Contrato) ---------- */
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:0;flex-wrap:wrap}
.tab{padding:11px 16px;font-size:13px;font-weight:700;color:var(--muted);border-radius:8px 8px 0 0;
  display:flex;align-items:center;gap:8px;cursor:pointer;border:1px solid transparent;border-bottom:0}
.tab:hover{background:#f2f2f5}
.tab.active{color:var(--text);background:#fff;border-color:var(--line);border-bottom:2px solid var(--ac-red)}
.tab .cnt{background:#eceef0;border-radius:20px;padding:0 7px;font-size:11px;color:#555}

/* ---------- LEGENDA ---------- */
.legend{display:flex;flex-wrap:wrap;gap:18px;background:#fff;border-radius:var(--radius);
  box-shadow:var(--shadow);padding:14px 18px;margin-bottom:16px;font-size:12px}
.legend .col{display:flex;flex-direction:column;gap:6px}
.legend b{font-size:11px;letter-spacing:.5px;color:var(--muted);text-transform:uppercase}
.legend .row{display:flex;align-items:center;gap:7px}

/* ---------- CONTRACT / DOC HEADER CARD ---------- */
.entity-head{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;background:#fafafb;
  border:1px solid var(--line);border-radius:var(--radius);padding:16px 18px;margin-bottom:16px}
.entity-head .meta{font-size:13px;line-height:1.7}
.entity-head .meta b{color:var(--muted);font-weight:600}
.pill-active{background:var(--ok);color:#fff;padding:8px 20px;border-radius:8px;font-weight:700;height:fit-content}

/* ---------- MODAL ---------- */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-start;
  justify-content:center;padding:40px 16px;z-index:60;overflow:auto}
.modal{background:#fff;border-radius:12px;width:100%;max-width:720px;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.modal .m-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line)}
.modal .m-head h3{margin:0;font-size:16px}
.modal .m-body{padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.modal .m-body .full{grid-column:1/-1}
.modal .m-foot{padding:14px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:8px}
.x-close{background:transparent;border:0;font-size:20px;color:var(--muted)}

/* ---------- BOLETIM (impressão) ---------- */
.boletim{background:#fff;padding:28px;max-width:920px;margin:0 auto;box-shadow:var(--shadow);border-radius:var(--radius)}
.boletim h2{margin:0 0 2px} .boletim .bsub{color:var(--muted);font-size:13px;margin-bottom:16px}
.verdict{display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:10px;font-weight:800;font-size:15px;margin:10px 0}
.verdict.go{background:var(--ok-bg);color:#1c7a41;border:1px solid #bfe6cd}
.verdict.no{background:var(--err-bg);color:#a12222;border:1px solid #f0c3c3}

.toast{position:fixed;bottom:22px;right:22px;background:#3a3a3c;color:#fff;padding:12px 18px;
  border-radius:10px;font-size:13px;z-index:80;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.help{font-size:12px;color:var(--muted);line-height:1.6}
.code{background:#f4f4f6;border:1px solid var(--line);border-radius:6px;padding:2px 6px;font-family:ui-monospace,monospace;font-size:12px}

@media print{
  .topbar,.sidebar,.page-head .actions,.no-print{display:none!important}
  .main{padding:0} body{background:#fff}
  .boletim{box-shadow:none}
}
@media(max-width:820px){
  .sidebar{width:60px} .sidebar .nav-item span.lbl,.sidebar .nav-sep{display:none}
  .modal .m-body{grid-template-columns:1fr}
}
