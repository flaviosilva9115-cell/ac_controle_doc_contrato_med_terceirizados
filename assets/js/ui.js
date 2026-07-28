/* =====================================================================
   ui.js — casca do app: logo AC, sidebar, roteador por hash, componentes
   ===================================================================== */
window.UI = (function(){
  // Símbolo oficial AC (4 triângulos) — NÃO alterar
  const LOGO = size => `<svg class="wm" viewBox="0 0 52 52" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="0,0 0,52 26,26" fill="#941616"/>
    <polygon points="0,0 52,0 26,26" fill="#717172"/>
    <polygon points="52,0 52,52 26,26" fill="#ffffff"/>
    <polygon points="0,52 52,52 26,26" fill="#941616"/></svg>`;

  const NAV = [
    {sep:'PRINCIPAL'},
    {r:'dashboard', ic:'📊', lbl:'Painel Geral'},
    {sep:'CADASTROS'},
    {r:'obras', ic:'🏗️', lbl:'Obras'},
    {r:'terceirizadas', ic:'🏢', lbl:'Terceirizadas'},
    {r:'contratos', ic:'📄', lbl:'Contratos'},
    {r:'sienge', ic:'🔗', lbl:'Importar do Sienge', admin:true},
    {sep:'LIBERAÇÃO'},
    {r:'boletins', ic:'✅', lbl:'Boletins'},
    {r:'periodos', ic:'📅', lbl:'Períodos'},
    {sep:'SISTEMA', admin:true},
    {r:'config', ic:'⚙️', lbl:'Configurações', admin:true}
  ];

  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function badge(label, cls){ return `<span class="badge ${cls}"><span class="dot"></span>${esc(label)}</span>`; }

  function toast(msg){
    const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
    document.body.appendChild(t); setTimeout(()=>t.remove(), 2600);
  }

  function modal(html){
    close();
    const bg=document.createElement('div'); bg.className='modal-bg'; bg.id='modal-bg';
    bg.innerHTML=`<div class="modal">${html}</div>`;
    bg.addEventListener('click',e=>{ if(e.target===bg) close(); });
    document.body.appendChild(bg);
  }
  function close(){ const m=document.getElementById('modal-bg'); if(m) m.remove(); }

  function renderShell(user){
    document.getElementById('login').classList.add('hidden');
    const app=document.getElementById('app'); app.style.display='block';
    app.innerHTML=`
      <div class="topbar">
        ${LOGO(30)}
        <div class="brand">AMORIM COUTINHO<small>CONTROLE DE TERCEIRIZADAS</small></div>
        <div class="spacer"></div>
        <span class="who">${esc(user.nome)} · ${esc(user.perfil||'')}</span>
        ${Auth.isAdmin()?'<button class="icon-btn" id="btn-sync" title="Sincronizar com GitHub">⟳ Sinc</button>':''}
        <button class="icon-btn" id="btn-logout">Sair</button>
      </div>
      <div class="layout">
        <nav class="sidebar" id="sidebar"></nav>
        <main class="main" id="main-content"></main>
      </div>
      <footer class="app-foot">Painel de Controle de Documentos de Terceirizadas · Desenvolvido por <b>Facten Suprimentos</b> · Todos os direitos reservados a <b>Amorim Coutinho</b> © 2026</footer>`;
    const sb=document.getElementById('sidebar');
    const admin=Auth.isAdmin();
    const items=NAV.filter(n=>!n.admin || admin).filter((n,i,a)=> !n.sep || (a[i+1] && !a[i+1].sep));
    sb.innerHTML=items.map(n=> n.sep
      ? `<div class="nav-sep">${n.sep}</div>`
      : `<div class="nav-item" data-r="${n.r}"><span class="ic">${n.ic}</span><span class="lbl">${n.lbl}</span></div>`
    ).join('');
    sb.querySelectorAll('.nav-item').forEach(it=>it.addEventListener('click',()=>{ location.hash='#/'+it.dataset.r; }));
    document.getElementById('btn-logout').addEventListener('click',()=>{ location.hash='#/'; location.reload(); });
    const bs=document.getElementById('btn-sync');
    if(bs) bs.addEventListener('click', async ()=>{
      try{ await Store.push(); toast('Enviado para o GitHub ✓'); }
      catch(e){ toast('Sinc: '+e.message); }
    });
  }

  function setActive(route){
    document.querySelectorAll('.nav-item').forEach(it=>
      it.classList.toggle('active', it.dataset.r===route));
  }

  // roteador: #/rota/param
  function router(){
    const parts=(location.hash.replace(/^#\/?/,'')||'dashboard').split('/');
    const route=parts[0]||'dashboard'; const param=parts[1]||null; const sub=parts[2]||null;
    if((route==='config'||route==='sienge') && !Auth.isAdmin()){ location.hash='#/dashboard'; return; }
    setActive(route);
    const host=document.getElementById('main-content'); if(!host) return;
    try{ window.Views.render(route, param, sub, host); bindFilters(); }
    catch(e){ host.innerHTML='<div class="card"><div class="empty">Erro: '+esc(e.message)+'</div></div>'; console.error(e); }
  }

  // helpers de página
  function pageHead(icon, title, actionsHTML){
    return `<div class="page-head"><div class="pic">${icon}</div><h1>${esc(title)}</h1>
      <div class="actions">${actionsHTML||''}</div></div><div class="page-rule"></div>`;
  }
  function table(cols, rows, id){
    return `<div class="tbl-wrap"><table class="tbl"${id?' id="'+id+'"':''}><thead><tr>${
      cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${
      rows.length? rows.join('') : `<tr><td colspan="${cols.length}"><div class="empty">Nenhum registro encontrado.</div></td></tr>`
    }</tbody></table></div>`;
  }
  // filtros dinâmicos: elementos com data-filter-tbl="#idTabela" filtram ao vivo.
  // selects com data-col="x" casam com o atributo data-x da linha; inputs casam com o texto.
  function bindFilters(){
    const groups={};
    document.querySelectorAll('[data-filter-tbl]').forEach(el=>{
      const sel=el.getAttribute('data-filter-tbl');
      (groups[sel]=groups[sel]||[]).push(el);
    });
    Object.keys(groups).forEach(sel=>{
      groups[sel].forEach(el=>{
        const ev=el.tagName==='SELECT'?'onchange':'oninput';
        el[ev]=()=>applyFilter(sel, groups[sel]);
      });
    });
  }
  function applyFilter(sel, controls){
    const tbl=document.querySelector(sel); if(!tbl) return;
    tbl.querySelectorAll('tbody tr').forEach(tr=>{
      if(tr.querySelector('.empty')){ tr.style.display=''; return; }
      let ok=true;
      controls.forEach(c=>{
        const v=(c.value||'').trim().toLowerCase(); if(!v) return;
        if(c.tagName==='SELECT' && c.getAttribute('data-col')){
          if((tr.getAttribute('data-'+c.getAttribute('data-col'))||'').toLowerCase()!==v) ok=false;
        } else if(tr.textContent.toLowerCase().indexOf(v)<0) ok=false;
      });
      tr.style.display=ok?'':'none';
    });
  }
  function option(list, val, label, sel){
    return list.map(x=>`<option value="${esc(x[val])}"${x[val]===sel?' selected':''}>${esc(x[label])}</option>`).join('');
  }

  return { LOGO, esc, badge, toast, modal, close, renderShell, setActive, router, pageHead, table, option, bindFilters };
})();
