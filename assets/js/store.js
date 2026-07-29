/* =====================================================================
   store.js — camada de dados
   Banco = um JSON. Persistência local (localStorage) por padrão.
   Sincronização opcional e GRATUITA com um arquivo db.json no próprio
   repositório do GitHub (via GitHub Contents API) => banco compartilhado.
   ===================================================================== */
(function(){
  const LS_KEY = 'painel_terc_db_v1';
  const CFG_KEY = 'painel_terc_cfg_v1';       // config do GitHub (sem token)
  const TOK_KEY = 'painel_terc_ghtoken';      // token só na sessão

  const emptyDB = () => ({
    meta:{ version:1, updatedAt:new Date().toISOString() },
    obras:[], fornecedores:[], contratos:[], colaboradores:[],
    documentos:[], boletins:[],
    usuarios:[{ id:'u-admin', nome:'Administrador', login:'admin', senha:'admin', perfil:'GESTOR' }]
  });

  let db = load();

  function uid(p){ return (p||'id')+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

  function load(){
    try{ const raw = localStorage.getItem(LS_KEY); if(raw) return JSON.parse(raw); }catch(e){}
    return emptyDB();
  }
  let _pushTimer=null;
  function save(){
    db.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(LS_KEY, JSON.stringify(db));
    if(_server){
      clearTimeout(_pushTimer);
      _pushTimer=setTimeout(()=>{ apiPush().catch(()=>{}); }, 2000);
      return;
    }
    const cfg=getCfg();
    if(cfg.autoSync && cfg.owner && cfg.repo && getToken()){
      clearTimeout(_pushTimer);
      _pushTimer=setTimeout(()=>{ push().catch(()=>{}); }, 2500);
    }
  }
  function reset(){ db = emptyDB(); save(); }

  // ---- CRUD genérico ----
  const all = c => (db[c]||[]).slice();
  const get = (c,id) => (db[c]||[]).find(x=>x.id===id) || null;
  function upsert(c,obj){
    if(!db[c]) db[c]=[];
    if(!obj.id){ obj.id = uid(c.slice(0,3)); db[c].push(obj); }
    else{ const i=db[c].findIndex(x=>x.id===obj.id); if(i>=0) db[c][i]=obj; else db[c].push(obj); }
    save(); return obj;
  }
  function remove(c,id){ if(db[c]) db[c]=db[c].filter(x=>x.id!==id); save(); }
  function where(c,fn){ return (db[c]||[]).filter(fn); }

  // ---- export / import (para versionar no repo ou compartilhar) ----
  function exportJSON(){ return JSON.stringify(db,null,2); }
  function importJSON(text){
    const parsed = JSON.parse(text);
    if(!parsed || typeof parsed!=='object') throw new Error('JSON inválido');
    db = Object.assign(emptyDB(), parsed); save();
  }

  // ---- Config GitHub sync ----
  function getCfg(){ try{ return JSON.parse(localStorage.getItem(CFG_KEY))||{}; }catch(e){ return {}; } }
  function setCfg(cfg){ localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }
  function getToken(){ return sessionStorage.getItem(TOK_KEY)||localStorage.getItem(TOK_KEY)||''; }
  function setToken(t, remember){
    sessionStorage.removeItem(TOK_KEY); localStorage.removeItem(TOK_KEY);
    if(t){ if(remember) localStorage.setItem(TOK_KEY,t); else sessionStorage.setItem(TOK_KEY,t); }
  }

  async function ghApi(path, method, body){
    const cfg=getCfg(), token=getToken();
    if(!cfg.owner||!cfg.repo||!token) throw new Error('Configure o GitHub (owner, repo e token) nas Configurações.');
    const url=`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path||'db.json'}`+(method==='GET'?`?ref=${cfg.branch||'main'}`:'');
    const res=await fetch(url,{ method, headers:{
        'Authorization':'Bearer '+token, 'Accept':'application/vnd.github+json'
      }, body: body?JSON.stringify(body):undefined });
    if(res.status===404 && method==='GET') return null;
    if(!res.ok) throw new Error('GitHub '+res.status+': '+(await res.text()).slice(0,180));
    return res.json();
  }
  function b64encode(str){ return btoa(unescape(encodeURIComponent(str))); }
  function b64decode(str){ return decodeURIComponent(escape(atob(str.replace(/\n/g,'')))); }

  async function pull(){
    const j=await ghApi('', 'GET');
    if(!j) throw new Error('Arquivo db.json ainda não existe no repo — faça um "Enviar" primeiro.');
    db = Object.assign(emptyDB(), JSON.parse(b64decode(j.content))); save();
    return j.sha;
  }
  async function push(){
    const cfg=getCfg();
    let sha=null; try{ const cur=await ghApi('','GET'); if(cur) sha=cur.sha; }catch(e){}
    await ghApi('', 'PUT', {
      message:'update db.json — painel terceirizadas '+new Date().toISOString(),
      content:b64encode(exportJSON()),
      branch:cfg.branch||'main',
      sha:sha||undefined
    });
  }

  async function pullSiengeImport(){
    const cfg=getCfg(), token=getToken();
    if(!cfg.owner||!cfg.repo||!token) throw new Error('Configure o GitHub (owner, repo e token) em Configurações → Banco & Sincronização.');
    const path=cfg.siengePath||'sienge-import.json';
    const url=`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${cfg.branch||'main'}`;
    const res=await fetch(url,{ headers:{'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'} });
    if(res.status===404) throw new Error('sienge-import.json ainda não existe no repositório — rode a Action "Sincronizar Sienge" primeiro.');
    if(!res.ok) throw new Error('GitHub '+res.status+': '+(await res.text()).slice(0,160));
    const j=await res.json();
    return JSON.parse(b64decode(j.content));
  }

  // ---- MODO SERVIDOR (Cloudflare Pages Functions + Access) ----
  let _server=false;
  const isServer=()=>_server;
  const setServerMode=b=>{ _server=!!b; };
  async function whoami(){
    try{ const r=await fetch('/api/whoami',{headers:{'Accept':'application/json'}});
      if(!r.ok) return null; const j=await r.json(); return (j&&j.email)?j:null;
    }catch(e){ return null; }
  }
  async function apiPull(){
    const r=await fetch('/api/db',{headers:{'Accept':'application/json'}});
    if(!r.ok) throw new Error('API /db '+r.status);
    const j=await r.json(); if(j && !j.error && Object.keys(j).length) db=Object.assign(emptyDB(), j); save();
  }
  async function apiPush(){
    const r=await fetch('/api/db',{method:'PUT',headers:{'Content-Type':'application/json'},body:exportJSON()});
    if(!r.ok) throw new Error('API /db '+r.status);
  }
  async function apiSienge(){
    const r=await fetch('/api/sienge',{headers:{'Accept':'application/json'}});
    if(r.status===404) throw new Error('sienge-import.json ainda não existe — rode a Action de sincronização.');
    if(!r.ok) throw new Error('API /sienge '+r.status);
    return r.json();
  }
  // upload de anexo ao Google Drive (via Function com service account) — só no modo servidor
  async function uploadToDrive(file, meta){
    if(!_server) throw new Error('Upload ao Drive disponível apenas no modo servidor (Cloudflare Pages + Access).');
    meta=meta||{};
    const fd=new FormData();
    fd.append('file', file);
    fd.append('credor', meta.credor||'');
    fd.append('contrato', meta.contrato||'');
    fd.append('tipo', meta.tipo||'');
    fd.append('nome', meta.nome||file.name||'documento');
    const r=await fetch('/api/upload',{ method:'POST', body:fd });
    let j={}; try{ j=await r.json(); }catch(e){}
    if(!r.ok || j.error) throw new Error(j.error || ('upload '+r.status));
    return j; // { id, name, url }
  }

  window.Store = {
    uid, save, reset, all, get, upsert, remove, where,
    exportJSON, importJSON, raw:()=>db,
    getCfg, setCfg, getToken, setToken,
    isServer, setServerMode, whoami, uploadToDrive,
    pull: (...a)=> _server ? apiPull() : pull(...a),
    push: (...a)=> _server ? apiPush() : push(...a),
    pullSiengeImport: (...a)=> _server ? apiSienge() : pullSiengeImport(...a)
  };
})();
