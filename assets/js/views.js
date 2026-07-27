/* =====================================================================
   views.js — telas do painel
   ===================================================================== */
window.Views = (function(){
  const E=UI.esc, B=UI.badge;
  const SEED=window.SEED;

  function render(route, param, sub, host){
    const fn = ({
      dashboard, obras, terceirizadas, contratos, boletins, periodos, config
    })[route] || dashboard;
    host.innerHTML = fn(param, sub);
    if(after[route]) after[route](param, sub);
  }
  const after={};

  /* ---------------- DASHBOARD ---------------- */
  function dashboard(){
    const obras=Auth.filterObras(Store.all('obras'));
    const forn=Store.all('fornecedores');
    const contr=Auth.filterContratos(Store.all('contratos'));
    const docs=Store.all('documentos');
    const cIds=contr.map(c=>c.id);
    const colab=Store.all('colaboradores').filter(cl=>cIds.indexOf(cl.contratoId)>=0);
    let venc=0, aVencer=0, aprovados=0, totalReq=0, medBloq=0;
    contr.forEach(c=>{
      const st=Logic.statusContrato(c, docs);
      aprovados+=st.aprovados; totalReq+=st.total; venc+=st.vencidos;
      const m=Logic.avaliaMedicao(c, periodoAtual(), docs);
      if(!m.liberado) medBloq++;
    });
    docs.forEach(d=>{ const td=Logic.byId(d.tipoDocumentoId); if(!td)return;
      const s=Logic.situacao(d,td); if(s.key==='A_VENCER')aVencer++; });
    let entrBloq=0, entrTot=0;
    colab.forEach(cl=>{ const c=Store.get('contratos',cl.contratoId); if(!c)return;
      entrTot++; if(!Logic.avaliaColaborador(cl,c,docs).liberado) entrBloq++; });
    const pct=totalReq?Math.round(aprovados/totalReq*100):0;

    const kpi=(v,l,cls)=>`<div class="kpi ${cls}"><div class="v">${v}</div><div class="l">${l}</div></div>`;
    return UI.pageHead('📊','Painel Geral','')+
      `<div class="kpis">
        ${kpi(obras.length,'Obras','')}
        ${kpi(forn.length,'Terceirizadas','')}
        ${kpi(contr.length,'Contratos ativos','k-red')}
        ${kpi(venc,'Documentos vencidos','k-err')}
        ${kpi(aVencer,'A vencer (30 dias)','k-warn')}
        ${kpi(medBloq,'Medições bloqueadas','k-err')}
      </div>
      <div class="card"><div class="card-title">Conformidade documental (empresa)</div>
        <div style="padding:16px 18px">
          <div style="display:flex;justify-content:space-between;font-size:13px"><span>${aprovados} de ${totalReq} documentos aprovados</span><b>${pct}%</b></div>
          <div class="bar"><i style="width:${pct}%;background:${pct>=80?'var(--ok)':pct>=50?'var(--warn)':'var(--err)'}"></i></div>
        </div>
      </div>
      <div class="kpis">
        ${kpi(entrTot,'Colaboradores cadastrados','')}
        ${kpi(entrBloq,'Impedidos de entrar no canteiro','k-err')}
        ${kpi(entrTot-entrBloq,'Liberados para entrada','k-ok')}
      </div>`;
  }
  function periodoAtual(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

  /* ---------------- OBRAS ---------------- */
  function obras(){
    const rows=Auth.filterObras(Store.all('obras')).map(o=>`<tr>
      <td class="num">${E(o.codigo||'—')}</td><td>${E(o.nome)}</td><td>${E(o.cidade||'—')}</td>
      <td style="text-align:right">
        <button class="icon-act edit" data-edit="${o.id}" title="Editar">✎</button>
        <button class="icon-act del" data-del="${o.id}" title="Excluir">🗑</button></td></tr>`);
    return UI.pageHead('🏗️','Obras','<button class="btn btn-dark" id="add">+ Nova</button>')+
      `<div class="card"><div class="card-title" style="justify-content:space-between">
        <span>Obras cadastradas</span>
        <input class="flt" data-filter-tbl="#tbl-obras" placeholder="🔎 Filtrar por nome, código ou cidade...">
      </div>
      ${UI.table(['Código','Nome','Cidade','Ações'], rows, 'tbl-obras')}</div>`;
  }
  after.obras=()=>{
    const bind=()=>{
      document.getElementById('add').onclick=()=>obraForm();
      document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>obraForm(Store.get('obras',b.dataset.edit)));
      document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
        if(confirm('Excluir esta obra?')){ Store.remove('obras',b.dataset.del); UI.router(); }});
    }; bind();
  };
  function obraForm(o){ o=o||{};
    UI.modal(`<div class="m-head"><h3>${o.id?'Editar':'Nova'} Obra</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body">
        <div class="field"><label>Código</label><input id="f-cod" value="${E(o.codigo||'')}"></div>
        <div class="field"><label>Cidade</label><input id="f-cid" value="${E(o.cidade||'')}"></div>
        <div class="field full"><label>Nome da obra</label><input id="f-nome" value="${E(o.nome||'')}"></div>
      </div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button>
        <button class="btn btn-primary" id="save">Salvar</button></div>`);
    document.getElementById('save').onclick=()=>{
      const nome=document.getElementById('f-nome').value.trim(); if(!nome)return UI.toast('Informe o nome.');
      Store.upsert('obras',{id:o.id,codigo:document.getElementById('f-cod').value.trim(),
        cidade:document.getElementById('f-cid').value.trim(),nome});
      UI.close(); UI.router();
    };
  }

  /* ---------------- TERCEIRIZADAS ---------------- */
  function terceirizadas(){
    const rows=Store.all('fornecedores').map(f=>`<tr>
      <td>${E(f.cnpj||'—')}</td><td>${E(f.razao)}</td><td>${E(f.fantasia||'—')}</td>
      <td>${f.ativo!==false?B('Ativo','b-ok'):B('Inativo','b-muted')}</td>
      <td style="text-align:right">
        <button class="icon-act edit" data-edit="${f.id}">✎</button>
        <button class="icon-act del" data-del="${f.id}">🗑</button></td></tr>`);
    return UI.pageHead('🏢','Terceirizadas','<button class="btn btn-dark" id="add">+ Nova</button>')+
      `<div class="card"><div class="card-title" style="justify-content:space-between">
        <span>Empresas terceirizadas</span>
        <input class="flt" data-filter-tbl="#tbl-terc" placeholder="🔎 Filtrar por CNPJ, razão ou fantasia...">
      </div>
      ${UI.table(['CNPJ','Razão Social','Nome Fantasia','Situação','Ações'], rows, 'tbl-terc')}</div>`;
  }
  after.terceirizadas=()=>{
    document.getElementById('add').onclick=()=>fornForm();
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>fornForm(Store.get('fornecedores',b.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
      if(confirm('Excluir esta terceirizada?')){ Store.remove('fornecedores',b.dataset.del); UI.router(); }});
  };
  function fornForm(f){ f=f||{};
    UI.modal(`<div class="m-head"><h3>${f.id?'Editar':'Nova'} Terceirizada</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body">
        <div class="field"><label>CNPJ</label><input id="f-cnpj" value="${E(f.cnpj||'')}"></div>
        <div class="field"><label>Situação</label><select id="f-ativo"><option value="1"${f.ativo!==false?' selected':''}>Ativo</option><option value="0"${f.ativo===false?' selected':''}>Inativo</option></select></div>
        <div class="field full"><label>Razão Social</label><input id="f-razao" value="${E(f.razao||'')}"></div>
        <div class="field full"><label>Nome Fantasia</label><input id="f-fant" value="${E(f.fantasia||'')}"></div>
      </div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button>
        <button class="btn btn-primary" id="save">Salvar</button></div>`);
    document.getElementById('save').onclick=()=>{
      const razao=document.getElementById('f-razao').value.trim(); if(!razao)return UI.toast('Informe a razão social.');
      Store.upsert('fornecedores',{id:f.id,cnpj:document.getElementById('f-cnpj').value.trim(),
        razao,fantasia:document.getElementById('f-fant').value.trim(),
        ativo:document.getElementById('f-ativo').value==='1'});
      UI.close(); UI.router();
    };
  }

  /* ---------------- CONTRATOS ---------------- */
  function contratos(param){
    if(param==='new') return contratoForm();
    if(param) return docsContrato(param);            // documentos do contrato
    const forn=Store.all('fornecedores'), obras=Store.all('obras'), docs=Store.all('documentos');
    const rows=Auth.filterContratos(Store.all('contratos')).map(c=>{
      const f=forn.find(x=>x.id===c.fornecedorId)||{}, o=obras.find(x=>x.id===c.obraId)||{};
      const st=Logic.statusContrato(c,docs);
      const sk = st.pct>=100?'completa': st.vencidos>0?'vencidos': st.pct>0?'parcial':'pendente';
      const bd = sk==='completa'?B('Completa','b-ok'): sk==='vencidos'?B('Com vencidos','b-err'): sk==='parcial'?B(st.pct+'%','b-part'):B('Pendente','b-warn');
      return `<tr data-obra="${E(o.nome||'')}" data-status="${sk}">
        <td class="num">${E(c.numero)}</td>
        <td>${E((c.objeto||'').slice(0,42))}</td>
        <td>${E(f.fantasia||f.razao||'—')}</td>
        <td>${E(o.nome||'—')}</td>
        <td>${E(Logic.contratoNome(c.tipoContratoId).slice(0,30))}</td>
        <td>${bd}</td>
        <td style="text-align:right">
          <button class="icon-act folder" data-docs="${c.id}" title="Documentos">📁</button>
          <button class="icon-act edit" data-edit="${c.id}" title="Editar">✎</button>
          <button class="icon-act del" data-del="${c.id}">🗑</button></td></tr>`;
    });
    const obrasList=Auth.filterObras(Store.all('obras'));
    return UI.pageHead('📄','Contratos','<button class="btn btn-dark" id="add">+ Novo</button>')+
      `<div class="card"><div class="filter-head">🔎 Filtros</div>
        <div class="filter-body">
          <div class="field"><label>Buscar</label><input data-filter-tbl="#tbl-contr" placeholder="Número, objeto, fornecedor..."></div>
          <div class="field"><label>Obra</label><select data-filter-tbl="#tbl-contr" data-col="obra"><option value="">Todas</option>${UI.option(obrasList,'nome','nome')}</select></div>
          <div class="field"><label>Status da documentação</label><select data-filter-tbl="#tbl-contr" data-col="status">
            <option value="">Todos</option><option value="completa">Completa</option><option value="parcial">Parcial</option><option value="pendente">Pendente</option><option value="vencidos">Com vencidos</option></select></div>
        </div>
        <div style="padding:0 16px 12px" class="help">Legenda: ${B('Completa','b-ok')} ${B('Parcial','b-part')} ${B('Pendente','b-warn')} ${B('Com vencidos','b-err')}</div>
      </div>
       <div class="card"><div class="card-title">Contratos</div>
       ${UI.table(['Número','Objeto','Fornecedor','Obra','Tipo de Contrato','Status Docs','Ações'], rows, 'tbl-contr')}</div>`;
  }
  after.contratos=(param)=>{
    if(param) return; // sub-tela cuida dos próprios binds
    const add=document.getElementById('add'); if(add) add.onclick=()=>{location.hash='#/contratos/new';};
    document.querySelectorAll('[data-docs]').forEach(b=>b.onclick=()=>{location.hash='#/contratos/'+b.dataset.docs;});
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>contratoForm(Store.get('contratos',b.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
      if(confirm('Excluir contrato?')){ Store.remove('contratos',b.dataset.del); UI.router(); }});
  };
  function contratoForm(c){ c=c||{};
    const forn=Store.all('fornecedores'), obras=Auth.filterObras(Store.all('obras')), tipos=Cat.tiposContrato();
    const opt=(list,v,l,sel)=>`<option value="">— selecione —</option>`+UI.option(list,v,l,sel);
    return UI.pageHead('✎', (c.id?'Editar':'Novo')+' Contrato',
      '<button class="btn" onclick="history.back()">← Voltar</button><button class="btn btn-primary" id="save">✔ Salvar</button>')+
      `<div class="card"><div class="filter-body" style="grid-template-columns:repeat(3,1fr)">
        <div class="field"><label>Número do Contrato *</label><input id="c-num" value="${E(c.numero||'')}"></div>
        <div class="field"><label>Empresa (grupo)</label><input id="c-emp" value="${E(c.empresa||'')}"></div>
        <div class="field"><label>Obra *</label><select id="c-obra">${opt(obras,'id','nome',c.obraId)}</select></div>
        <div class="field"><label>Fornecedor (terceirizada) *</label><select id="c-forn">${opt(forn.map(f=>({id:f.id,nome:f.fantasia||f.razao})),'id','nome',c.fornecedorId)}</select></div>
        <div class="field"><label>Tipo de Contrato * (define o checklist)</label><select id="c-tipo">${opt(tipos,'id','nome',c.tipoContratoId)}</select></div>
        <div class="field"><label>Controle de Documentação</label><select id="c-ctrl"><option value="1"${c.controleDoc!==false?' selected':''}>Sim</option><option value="0"${c.controleDoc===false?' selected':''}>Não</option></select></div>
        <div class="field full"><label>Objeto</label><textarea id="c-obj">${E(c.objeto||'')}</textarea></div>
        <div class="field full"><label>Observação Padrão de Medição</label><input id="c-obs" value="${E(c.obsMedicao||'')}"></div>
        <div class="field"><label>Data Contrato</label><input type="date" id="c-dc" value="${E(c.dataContrato||'')}"></div>
        <div class="field"><label>Data Início</label><input type="date" id="c-di" value="${E(c.dataInicio||'')}"></div>
        <div class="field"><label>Data Término</label><input type="date" id="c-dt" value="${E(c.dataTermino||'')}"></div>
      </div></div>
      <div class="help card" style="padding:14px 18px">Ao salvar, o checklist de documentos exigidos é gerado automaticamente a partir da matriz do <b>Tipo de Contrato</b> escolhido.</div>
      <script></script>`;
  }
  after['contratos-form']=null;
  // salvar contrato (delegação via after.contratos quando param==='new' ou edição)
  document.addEventListener('click',function(e){
    if(e.target && e.target.id==='save' && location.hash.indexOf('#/contratos')===0
       && (location.hash.endsWith('/new')||/#\/contratos\/[^/]+$/.test(location.hash)) ){
      const g=id=>{const el=document.getElementById(id);return el?el.value:undefined;};
      if(!document.getElementById('c-num')) return; // não é o form
      const numero=g('c-num').trim(), obraId=g('c-obra'), fornId=g('c-forn'), tipo=g('c-tipo');
      if(!numero||!obraId||!fornId||!tipo){ UI.toast('Preencha Número, Obra, Fornecedor e Tipo.'); return; }
      const editingId = /#\/contratos\/([^/]+)$/.test(location.hash) && RegExp.$1!=='new' ? RegExp.$1 : undefined;
      const saved=Store.upsert('contratos',{ id:editingId, numero, empresa:g('c-emp'),
        obraId, fornecedorId:fornId, tipoContratoId:tipo, controleDoc:g('c-ctrl')==='1',
        objeto:g('c-obj'), obsMedicao:g('c-obs'),
        dataContrato:g('c-dc'), dataInicio:g('c-di'), dataTermino:g('c-dt'), ativo:true });
      UI.toast('Contrato salvo ✓'); location.hash='#/contratos/'+saved.id;
    }
  });

  /* ------------- DOCUMENTOS DO CONTRATO (5 abas) ------------- */
  const TABS=[['ATIVACAO','Docs. Ativação'],['PERIODICO','Docs. Periódicos'],
    ['ENCERRAMENTO','Docs. Encerramento'],['TREINAMENTOS','Treinamentos/Certificados'],
    ['COLABORADORES','Colaboradores']];
  function docsContrato(id, tab){
    const c=Store.get('contratos',id); if(!c) return '<div class="card"><div class="empty">Contrato não encontrado.</div></div>';
    const f=Store.get('fornecedores',c.fornecedorId)||{}, o=Store.get('obras',c.obraId)||{};
    tab=window.__docTab||'ATIVACAO';
    const docs=Store.all('documentos');
    const req=Logic.docsDoTipo(c.tipoContratoId);
    const counts={}; TABS.forEach(t=>counts[t[0]]=0);
    req.forEach(d=>{ counts[Logic.aba(d)]=(counts[Logic.aba(d)]||0)+1; });

    const tabsHTML=`<div class="tabs">${TABS.map(([k,l])=>
      `<div class="tab ${k===tab?'active':''}" data-tab="${k}">📁 ${l} <span class="cnt">${counts[k]||0}</span></div>`).join('')}</div>`;

    const head=`<div class="entity-head">
      <div class="meta"><div style="font-weight:800;font-size:15px">${E(f.razao||'—')}</div>
        <b>Nome Fantasia:</b> ${E(f.fantasia||'—')}<br><b>CNPJ:</b> ${E(f.cnpj||'—')} &nbsp;·&nbsp;
        <b>Obra:</b> ${E(o.nome||'—')} &nbsp;·&nbsp; <b>Contrato:</b> ${E(c.numero)}<br>
        <b>Tipo:</b> ${E(Logic.contratoNome(c.tipoContratoId))}</div>
      <div class="pill-active">${c.ativo!==false?'Ativo':'Inativo'}</div></div>`;

    const legend=`<div class="legend">
      <div class="col"><b>Situação</b>
        <div class="row">${B('Normal','b-ok')}</div><div class="row">${B('Vencido','b-err')}</div><div class="row">${B('Vazio','b-warn')}</div></div>
      <div class="col"><b>Status</b>
        <div class="row">${B('Aprovado','b-ok')} ${B('Reprovado','b-err')}</div>
        <div class="row">${B('Aguardando','b-warn')} ${B('Anexos Pendentes','b-pend')} ${B('Parcial','b-part')}</div></div></div>`;

    let body;
    if(tab==='COLABORADORES') body=colaboradoresTab(c, docs);
    else body=docsTab(c, tab, docs);

    return UI.pageHead('📁','Documentos do Contrato',
      '<button class="btn btn-primary" id="aprovar-todos">✔ Aprovar todos (empresa)</button><button class="btn" onclick="location.hash=\'#/contratos\'">← Voltar</button>')+
      head+tabsHTML+legend+body;
  }
  after['contratos']; // já definido; abaixo tratamos binds da subtela em router hook
  function docsTab(c, tab, docs){
    const isPeriodico = tab==='PERIODICO';
    const list=Logic.docsDoTipo(c.tipoContratoId).filter(d=>Logic.aba(d)===tab);
    const periodo = isPeriodico ? (window.__periodo||periodoAtual()) : null;
    const locked = isPeriodico && !Logic.periodoAberto(periodo);
    const dis = locked?'disabled style="opacity:.35;cursor:not-allowed"':'';
    const rows=list.map(td=>{
      const inst=Logic.findInst(docs, td.id, c.id, null, isPeriodico?periodo:null);
      const sit=Logic.situacao(inst,td); const st=Logic.statusInfo((inst&&inst.statusAprovacao)||'VAZIO');
      const dias = sit.dias==null?'N/A':(sit.dias+' d');
      return `<tr>
        <td>${E(td.documento)}<div style="font-size:11px;color:#9aa0a6">${E(td.setor)} · ${td.validadeObrigatoria?'validade obrigatória':'sem validade'}</div></td>
        <td>${dias}</td>
        <td>${inst&&inst.validade?Logic.fmtDate(inst.validade):'—'}</td>
        <td>${B(sit.label,sit.cls)}</td>
        <td>${B(st.label,st.cls)}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="icon-act ok" title="Aprovar" data-act="APROVADO" data-td="${td.id}" data-per="${isPeriodico?periodo:''}" ${dis}>✔</button>
          <button class="icon-act folder" title="Anexar/editar" data-act="anexar" data-td="${td.id}" data-per="${isPeriodico?periodo:''}" ${dis}>＋</button>
          <button class="icon-act del" title="Reprovar" data-act="REPROVADO" data-td="${td.id}" data-per="${isPeriodico?periodo:''}" ${dis}>✕</button>
        </td></tr>`;
    });
    const perHTML = isPeriodico ? `<div style="padding:12px 16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <label style="font-size:12px;color:var(--muted)">Período:</label>
        <input type="month" id="periodo" value="${periodo}" style="padding:7px 10px;border:1px solid var(--line);border-radius:8px">
        ${locked?B('Período FECHADO — somente leitura','b-err'):B('Período aberto','b-ok')}
      </div>`:'';
    return `<div class="card">${perHTML}${UI.table(
      ['Documento','Dias até venc.','Validade','Situação','Status','Ações'], rows)}</div>`;
  }
  function colaboradoresTab(c, docs){
    const colab=Store.where('colaboradores',x=>x.contratoId===c.id);
    const rows=colab.map(cl=>{
      const av=Logic.avaliaColaborador(cl,c,docs);
      return `<tr>
        <td>${E(cl.matricula||'—')}</td><td>${E(cl.cpf||'—')}</td><td>${E(cl.nome)}</td>
        <td>${E(cl.funcao||'—')}</td>
        <td>${av.liberado?B('Liberado','b-ok'):B('Impedido','b-err')}</td>
        <td style="text-align:right">
          <button class="icon-act view" data-worker="${cl.id}" title="Documentos">📄</button>
          <button class="icon-act del" data-delc="${cl.id}">🗑</button></td></tr>`;
    });
    return `<div class="card"><div class="card-title" style="justify-content:space-between">
        <span>Colaboradores da terceirizada</span>
        <button class="btn btn-sm btn-dark" id="add-colab">+ Colaborador</button></div>
      ${UI.table(['Matrícula','CPF','Nome','Função','Entrada no canteiro','Ações'], rows)}</div>`;
  }

  // binds da subtela de documentos (chamado pelo router hook em app.js)
  function bindDocsContrato(id){
    const c=Store.get('contratos',id); if(!c) return;
    const at=document.getElementById('aprovar-todos');
    if(at) at.onclick=()=>{ if(confirm('Aprovar todos os documentos da EMPRESA deste contrato (habilitação/ativação, encerramento e o período periódico atual)? Isso marca a documentação como completa mesmo com pendências.')) aprovarTodosEmpresa(c); };
    document.querySelectorAll('.tab[data-tab]').forEach(t=>t.onclick=()=>{ window.__docTab=t.dataset.tab; UI.router(); });
    const per=document.getElementById('periodo'); if(per) per.onchange=()=>{ window.__periodo=per.value; UI.router(); };
    document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{
      const td=b.dataset.td, act=b.dataset.act, periodo=b.dataset.per||null;
      if(act==='anexar') return anexarForm(c, td, periodo, null);
      setStatusDoc(c, td, periodo, null, act);
    });
    const ac=document.getElementById('add-colab'); if(ac) ac.onclick=()=>colabForm(c);
    document.querySelectorAll('[data-worker]').forEach(b=>b.onclick=()=>workerDocs(c, b.dataset.worker));
    document.querySelectorAll('[data-delc]').forEach(b=>b.onclick=()=>{
      if(confirm('Excluir colaborador?')){ Store.remove('colaboradores',b.dataset.delc); UI.router(); }});
  }
  function setStatusDoc(c, tdId, periodo, colaboradorId, status){
    const inst=Logic.findInst(Store.all('documentos'), tdId, colaboradorId?null:c.id, colaboradorId, periodo)
      || {tipoDocumentoId:tdId, contratoId:colaboradorId?null:c.id, colaboradorId:colaboradorId||null, periodo:periodo||null, entregue:true};
    inst.entregue=true; inst.statusAprovacao=status;
    inst.inseridoPor=(window.__user||{}).nome||'—'; inst.inseridoEm=new Date().toISOString();
    Store.upsert('documentos',inst); UI.toast('Status: '+Logic.statusInfo(status).label); UI.router();
  }
  function aprovarTodosEmpresa(c){
    const periodo=window.__periodo||periodoAtual();
    const docs=Store.all('documentos');
    Logic.docsDoTipo(c.tipoContratoId).filter(d=>Logic.nivel(d)==='EMPRESA').forEach(td=>{
      const isPer=td.fase==='PERIODICO'; const per=isPer?periodo:null;
      const inst=Logic.findInst(docs, td.id, c.id, null, per)
        || {tipoDocumentoId:td.id, contratoId:c.id, colaboradorId:null, periodo:per};
      inst.entregue=true; inst.statusAprovacao='APROVADO';
      inst.inseridoPor=(window.__user||{}).nome||'—'; inst.inseridoEm=new Date().toISOString();
      Store.upsert('documentos', inst);
    });
    UI.toast('Documentos da empresa aprovados ✓'); UI.router();
  }
  function anexarForm(c, tdId, periodo, colaboradorId){
    const td=Logic.byId(tdId);
    const inst=Logic.findInst(Store.all('documentos'), tdId, colaboradorId?null:c.id, colaboradorId, periodo)||{};
    UI.modal(`<div class="m-head"><h3>Anexar documento</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body">
        <div class="field full"><label>Documento</label><input value="${E(td.documento)}" disabled></div>
        <div class="field full"><label>Link do anexo (Google Drive / URL)</label><input id="a-url" value="${E(inst.anexoUrl||'')}" placeholder="https://drive.google.com/..."></div>
        ${td.validadeObrigatoria?`<div class="field"><label>Validade *</label><input type="date" id="a-val" value="${E(inst.validade||'')}"></div>`:''}
        <div class="field"><label>Status</label><select id="a-st">
          ${['ANEXOS_PENDENTES','AGUARDANDO','APROVADO','PARCIAL','REPROVADO'].map(s=>`<option value="${s}"${(inst.statusAprovacao||'ANEXOS_PENDENTES')===s?' selected':''}>${Logic.statusInfo(s).label}</option>`).join('')}
        </select></div>
      </div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button>
        <button class="btn btn-primary" id="save">Salvar</button></div>`);
    document.getElementById('save').onclick=()=>{
      const val=document.getElementById('a-val');
      if(td.validadeObrigatoria && val && !val.value) return UI.toast('Informe a validade.');
      const rec=Object.assign(inst,{ tipoDocumentoId:tdId, contratoId:colaboradorId?null:c.id,
        colaboradorId:colaboradorId||null, periodo:periodo||null, entregue:true,
        anexoUrl:document.getElementById('a-url').value.trim(),
        validade: val?val.value:inst.validade,
        statusAprovacao:document.getElementById('a-st').value,
        inseridoPor:(window.__user||{}).nome||'—', inseridoEm:new Date().toISOString() });
      Store.upsert('documentos',rec); UI.close(); UI.router();
    };
  }
  function colabForm(c){
    UI.modal(`<div class="m-head"><h3>Novo Colaborador</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body">
        <div class="field"><label>Matrícula</label><input id="cl-mat"></div>
        <div class="field"><label>CPF</label><input id="cl-cpf"></div>
        <div class="field full"><label>Nome *</label><input id="cl-nome"></div>
        <div class="field"><label>Função</label><input id="cl-fun"></div>
        <div class="field"><label>Admissão</label><input type="date" id="cl-adm"></div>
      </div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button>
        <button class="btn btn-primary" id="save">Salvar</button></div>`);
    document.getElementById('save').onclick=()=>{
      const nome=document.getElementById('cl-nome').value.trim(); if(!nome)return UI.toast('Informe o nome.');
      Store.upsert('colaboradores',{ fornecedorId:c.fornecedorId, contratoId:c.id, nome,
        matricula:document.getElementById('cl-mat').value.trim(), cpf:document.getElementById('cl-cpf').value.trim(),
        funcao:document.getElementById('cl-fun').value.trim(), admissao:document.getElementById('cl-adm').value, ativo:true });
      UI.close(); UI.router();
    };
  }
  function workerDocs(c, colabId){
    const cl=Store.get('colaboradores',colabId); const docs=Store.all('documentos');
    const av=Logic.avaliaColaborador(cl,c,docs);
    const rows=av.lista.map(x=>`<tr>
      <td>${E(x.td.documento)}</td>
      <td>${x.inst&&x.inst.validade?Logic.fmtDate(x.inst.validade):'—'}</td>
      <td>${B(x.sit.label,x.sit.cls)}</td>
      <td>${B(Logic.statusInfo(x.st).label,Logic.statusInfo(x.st).cls)}</td>
      <td style="text-align:right;white-space:nowrap">
        <button class="icon-act ok" data-wact="APROVADO" data-td="${x.td.id}">✔</button>
        <button class="icon-act folder" data-wact="anexar" data-td="${x.td.id}">＋</button>
        <button class="icon-act del" data-wact="REPROVADO" data-td="${x.td.id}">✕</button></td></tr>`);
    UI.modal(`<div class="m-head"><h3>${E(cl.nome)} — ${av.liberado?'✅ Liberado':'⛔ Impedido'}</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body" style="grid-template-columns:1fr">${UI.table(['Documento','Validade','Situação','Status','Ações'],rows)}</div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Fechar</button></div>`);
    document.querySelectorAll('[data-wact]').forEach(b=>b.onclick=()=>{
      const act=b.dataset.wact, td=b.dataset.td;
      if(act==='anexar'){ UI.close(); anexarForm(c, td, null, colabId); }
      else { setStatusDoc(c, td, null, colabId, act); UI.close(); workerDocs(c, colabId); }
    });
  }

  /* ---------------- BOLETINS ---------------- */
  function boletins(param){
    if(param==='entrada') return boletimEntrada();
    if(param==='medicao') return boletimMedicao();
    return UI.pageHead('✅','Boletins de Liberação','')+
      `<div class="kpis">
        <div class="card" style="padding:22px;cursor:pointer" id="go-entrada">
          <div style="font-size:32px">🚧</div><h3 style="margin:8px 0 4px">Boletim de Entrada no Canteiro</h3>
          <div class="help">Situação de cada colaborador e seus documentos. Libera ou bloqueia a entrada na obra.</div></div>
        <div class="card" style="padding:22px;cursor:pointer" id="go-medicao">
          <div style="font-size:32px">💰</div><h3 style="margin:8px 0 4px">Boletim de Medição</h3>
          <div class="help">Documentos periódicos do mês + habilitação da empresa. Libera ou bloqueia o pagamento.</div></div>
      </div>`;
  }
  after.boletins=(param)=>{
    if(!param){
      document.getElementById('go-entrada').onclick=()=>location.hash='#/boletins/entrada';
      document.getElementById('go-medicao').onclick=()=>location.hash='#/boletins/medicao';
      return;
    }
    const ob=document.getElementById('b-obra');
    if(ob) ob.onchange=()=>{ window.__bobra=ob.value; window.__bcontrato=''; UI.router(); };
    const sel=document.getElementById('b-contrato');
    if(sel) sel.onchange=()=>{ window.__bcontrato=sel.value; UI.router(); };
    const per=document.getElementById('b-periodo');
    if(per) per.onchange=()=>{ window.__bperiodo=per.value; UI.router(); };
    const pr=document.getElementById('print'); if(pr) pr.onclick=()=>window.print();
  };
  function obraPicker(){
    const obras=Auth.filterObras(Store.all('obras'));
    return `<select id="b-obra"><option value="">Todas as obras</option>${UI.option(obras,'id','nome',window.__bobra)}</select>`;
  }
  function contratoPicker(id){
    let list=Auth.filterContratos(Store.all('contratos'));
    if(window.__bobra) list=list.filter(c=>c.obraId===window.__bobra);
    const contr=list.map(c=>{
      const f=Store.get('fornecedores',c.fornecedorId)||{}; return {id:c.id,nome:c.numero+' · '+(f.fantasia||f.razao||'')};});
    return `<select id="${id}"><option value="">— selecione o contrato —</option>${UI.option(contr,'id','nome',window.__bcontrato)}</select>`;
  }
  function boletimEntrada(){
    const cid=window.__bcontrato; const c=cid?Store.get('contratos',cid):null;
    let body='<div class="card"><div class="empty">Selecione um contrato para gerar o boletim.</div></div>';
    if(c){
      const f=Store.get('fornecedores',c.fornecedorId)||{}, o=Store.get('obras',c.obraId)||{}, docs=Store.all('documentos');
      const colab=Store.where('colaboradores',x=>x.contratoId===c.id);
      const blocos=colab.map(cl=>{
        const av=Logic.avaliaColaborador(cl,c,docs);
        const rows=av.lista.map(x=>`<tr><td>${E(x.td.documento)}</td><td>${x.inst&&x.inst.validade?Logic.fmtDate(x.inst.validade):'—'}</td>
          <td>${B(x.sit.label,x.sit.cls)}</td><td>${B(Logic.statusInfo(x.st).label,Logic.statusInfo(x.st).cls)}</td></tr>`);
        return `<h3 style="margin:18px 0 4px">${E(cl.nome)} — ${E(cl.funcao||'')}
          <span class="verdict ${av.liberado?'go':'no'}" style="font-size:12px;padding:4px 12px;margin-left:8px">${av.liberado?'LIBERADO':'BLOQUEADO'}</span></h3>
          ${UI.table(['Documento','Validade','Situação','Status'],rows)}`;
      }).join('') || '<div class="empty">Sem colaboradores cadastrados neste contrato.</div>';
      const totLib=colab.filter(cl=>Logic.avaliaColaborador(cl,c,docs).liberado).length;
      body=`<div class="boletim">
        <h2>Boletim de Entrada no Canteiro</h2>
        <div class="bsub">${E(f.razao||'')} · Obra: ${E(o.nome||'')} · Contrato ${E(c.numero)} · Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
        <div class="verdict ${totLib===colab.length&&colab.length>0?'go':'no'}">${totLib} de ${colab.length} colaboradores liberados</div>
        <div class="help" style="margin:8px 0 14px">Um colaborador só é <b>liberado para entrada</b> quando <b>todos</b> os seus documentos estão anexados, dentro da validade e <b>aprovados</b> pelo setor responsável (SESMT / DP).</div>
        ${blocos}</div>`;
    }
    return UI.pageHead('🚧','Boletim de Entrada',
      '<button class="btn no-print" id="print">🖨 Imprimir</button>')+
      `<div class="card no-print"><div class="filter-body">
        <div class="field"><label>Obra</label>${obraPicker()}</div>
        <div class="field"><label>Contrato</label>${contratoPicker('b-contrato')}</div></div></div>${body}`;
  }
  function boletimMedicao(){
    const cid=window.__bcontrato; const c=cid?Store.get('contratos',cid):null;
    const periodo=window.__bperiodo||periodoAtual();
    let body='<div class="card"><div class="empty">Selecione um contrato para gerar o boletim.</div></div>';
    if(c){
      const f=Store.get('fornecedores',c.fornecedorId)||{}, o=Store.get('obras',c.obraId)||{}, docs=Store.all('documentos');
      const m=Logic.avaliaMedicao(c, periodo, docs);
      const pstatus=Logic.periodoStatus(periodo);
      const line=x=>`<tr><td>${E(x.td.documento)}</td>
        <td>${x.inst&&x.inst.validade?Logic.fmtDate(x.inst.validade):'—'}</td>
        <td>${x.inst&&x.inst.inseridoPor?E(x.inst.inseridoPor):'—'}</td>
        <td>${B(x.sit.label,x.sit.cls)}</td><td>${B(Logic.statusInfo(x.st).label,Logic.statusInfo(x.st).cls)}</td></tr>`;
      body=`<div class="boletim">
        <h2>Boletim de Medição</h2>
        <div class="bsub">${E(f.razao||'')} · Obra: ${E(o.nome||'')} · Contrato ${E(c.numero)} · Período ${E(periodo)} ${pstatus==='FECHADO'?'(fechado)':'(aberto)'} · Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>
        <div class="verdict ${m.liberado?'go':'no'}">${m.liberado?'✅ PAGAMENTO LIBERADO':'⛔ PAGAMENTO BLOQUEADO'}</div>
        <div class="help" style="margin:8px 0 14px">Os documentos periódicos <b>anexados e validados para ${E(periodo)}</b> entram automaticamente neste boletim. A medição só é liberada quando todos estão <b>Aprovados</b> e a habilitação da empresa (CNDs/licenças) está válida.</div>
        <h3 style="margin:16px 0 4px">Documentos periódicos do período (${E(periodo)})</h3>
        ${UI.table(['Documento','Validade','Inserido por','Situação','Status'], m.periodicos.map(line))}
        <h3 style="margin:16px 0 4px">Habilitação da empresa (CNDs / licenças)</h3>
        ${UI.table(['Documento','Validade','Inserido por','Situação','Status'], m.habilitacao.map(line))}
      </div>`;
    }
    return UI.pageHead('💰','Boletim de Medição',
      '<button class="btn no-print" id="print">🖨 Imprimir</button>')+
      `<div class="card no-print"><div class="filter-body">
        <div class="field"><label>Obra</label>${obraPicker()}</div>
        <div class="field"><label>Contrato</label>${contratoPicker('b-contrato')}</div>
        <div class="field"><label>Período da medição</label><input type="month" id="b-periodo" value="${periodo}"></div>
      </div></div>${body}`;
  }

  /* ---------------- PERÍODOS ---------------- */
  function periodos(){
    const list=Store.all('periodos').slice().sort((a,b)=>b.competencia.localeCompare(a.competencia));
    const rows=list.map(p=>`<tr>
      <td class="num">${E(p.competencia)}</td>
      <td>${p.status==='FECHADO'?B('Fechado','b-err'):B('Aberto','b-ok')}</td>
      <td>${E(p.fechadoPor||'—')}</td>
      <td style="text-align:right;white-space:nowrap">
        ${p.status==='FECHADO'
          ? `<button class="btn btn-sm" data-open="${p.id}">Reabrir</button>`
          : `<button class="btn btn-sm btn-dark" data-close="${p.id}">Fechar</button>`}
        <button class="icon-act del" data-delp="${p.id}">🗑</button></td></tr>`);
    return UI.pageHead('📅','Períodos',
      `<input type="month" id="np" value="${periodoAtual()}" style="padding:8px 10px;border:1px solid var(--line);border-radius:8px">
       <button class="btn btn-dark" id="addp">+ Abrir período</button>`)+
      `<div class="card"><div class="card-title" style="justify-content:space-between">
        <span>Competências</span>
        <input class="flt" data-filter-tbl="#tbl-per" placeholder="🔎 Filtrar competência ou situação...">
      </div>
      ${UI.table(['Competência','Situação','Fechado por','Ações'], rows, 'tbl-per')}</div>
      <div class="help card" style="padding:14px 18px">Fechar um período trava a inclusão e a edição de documentos periódicos e o lançamento da medição daquele mês.</div>`;
  }
  after.periodos=()=>{
    document.getElementById('addp').onclick=()=>{
      const comp=document.getElementById('np').value; if(!comp)return;
      if(Store.all('periodos').some(p=>p.competencia===comp)) return UI.toast('Período já existe.');
      Store.upsert('periodos',{competencia:comp,status:'ABERTO'}); UI.router();
    };
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>setPeriodo(b.dataset.close,'FECHADO'));
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>setPeriodo(b.dataset.open,'ABERTO'));
    document.querySelectorAll('[data-delp]').forEach(b=>b.onclick=()=>{ if(confirm('Excluir período?')){ Store.remove('periodos',b.dataset.delp); UI.router(); }});
  };
  function setPeriodo(id,status){
    const p=Store.get('periodos',id); if(!p)return;
    p.status=status;
    p.fechadoPor=status==='FECHADO'?((window.__user||{}).nome||'—'):null;
    p.fechadoEm=status==='FECHADO'?new Date().toISOString():null;
    Store.upsert('periodos',p); UI.toast(status==='FECHADO'?'Período fechado':'Período reaberto'); UI.router();
  }

  /* ---------------- CONFIG (abas) ---------------- */
  const PERFIS=['GESTOR','COMPRADOR','APROVADOR','SESMT','DP','PORTARIA','FINANCEIRO'];
  const CFG_TABS=[['usuarios','Usuários'],['tcontrato','Tipos de Contrato'],['tdoc','Tipos de Documento'],['colab','Colaboradores'],['banco','Banco & Sincronização']];
  function config(){
    const tab=window.__cfgTab||'usuarios';
    const tabs=`<div class="tabs">${CFG_TABS.map(([k,l])=>`<div class="tab ${k===tab?'active':''}" data-ctab="${k}">${l}</div>`).join('')}</div>`;
    const body=({usuarios:cfgUsuarios,tcontrato:cfgTContrato,tdoc:cfgTDoc,colab:cfgColab,banco:cfgBanco})[tab]();
    return UI.pageHead('⚙️','Configurações','')+tabs+body;
  }
  after.config=()=>{
    document.querySelectorAll('[data-ctab]').forEach(t=>t.onclick=()=>{ window.__cfgTab=t.dataset.ctab; UI.router(); });
    ({usuarios:bindUsuarios,tcontrato:bindTContrato,tdoc:bindTDoc,colab:bindColab,banco:bindBanco})[window.__cfgTab||'usuarios']();
  };

  /* Usuários */
  function cfgUsuarios(){
    const rows=Store.all('usuarios').map(u=>`<tr>
      <td>${E(u.nome||'—')}</td><td>${E(u.email||u.login||'—')}</td><td>${E(u.perfil||'—')}</td>
      <td>${(u.obras==='all'||!Array.isArray(u.obras))?B('Todas as obras','b-part'):B(u.obras.length+' obra(s)','b-muted')}</td>
      <td style="text-align:right"><button class="icon-act edit" data-eu="${u.id}">✎</button><button class="icon-act del" data-du="${u.id}">🗑</button></td></tr>`);
    return `<div class="card"><div class="card-title" style="justify-content:space-between"><span>Usuários</span><button class="btn btn-sm btn-dark" id="addu">+ Usuário</button></div>
      ${UI.table(['Nome','E-mail','Perfil','Acesso','Ações'], rows)}</div>`;
  }
  function bindUsuarios(){
    document.getElementById('addu').onclick=()=>userForm();
    document.querySelectorAll('[data-eu]').forEach(b=>b.onclick=()=>userForm(Store.get('usuarios',b.dataset.eu)));
    document.querySelectorAll('[data-du]').forEach(b=>b.onclick=()=>{
      if(Store.all('usuarios').length<=1) return UI.toast('Deixe ao menos um usuário.');
      if(confirm('Excluir usuário?')){ Store.remove('usuarios',b.dataset.du); UI.router(); }});
  }
  function userForm(u){ u=u||{obras:'all'};
    const obras=Store.all('obras'); const all=(u.obras==='all'||!Array.isArray(u.obras));
    const obrasHTML=obras.length? obras.map(o=>`<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:4px 0">
      <input type="checkbox" class="u-obra" value="${o.id}" ${(!all&&u.obras.indexOf(o.id)>=0)?'checked':''}> ${E(o.nome)}</label>`).join('') : '<div class="help">Nenhuma obra cadastrada.</div>';
    UI.modal(`<div class="m-head"><h3>${u.id?'Editar':'Novo'} Usuário</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body">
        <div class="field"><label>Nome</label><input id="u-nome" value="${E(u.nome||'')}"></div>
        <div class="field"><label>E-mail</label><input id="u-email" value="${E(u.email||u.login||'')}"></div>
        <div class="field"><label>Senha</label><input id="u-senha" type="text" value="${E(u.senha||'')}"></div>
        <div class="field"><label>Perfil</label><select id="u-perfil">${PERFIS.map(p=>`<option${(u.perfil||'COMPRADOR')===p?' selected':''}>${p}</option>`).join('')}</select></div>
        <div class="field full"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="u-all" ${all?'checked':''}> Acesso a TODAS as obras</label></div>
        <div class="field full" id="u-owrap" style="${all?'opacity:.4':''}"><label>Obras liberadas</label><div>${obrasHTML}</div></div>
      </div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button><button class="btn btn-primary" id="save">Salvar</button></div>`);
    const allChk=document.getElementById('u-all');
    allChk.onchange=()=>{ document.getElementById('u-owrap').style.opacity=allChk.checked?'.4':'1'; };
    document.getElementById('save').onclick=()=>{
      const email=document.getElementById('u-email').value.trim(); if(!email)return UI.toast('Informe o e-mail.');
      let obrasVal='all';
      if(!allChk.checked) obrasVal=[].slice.call(document.querySelectorAll('.u-obra:checked')).map(x=>x.value);
      Store.upsert('usuarios',{id:u.id,nome:document.getElementById('u-nome').value.trim()||email,email,login:email,
        senha:document.getElementById('u-senha').value,perfil:document.getElementById('u-perfil').value,obras:obrasVal});
      UI.close(); UI.router();
    };
  }

  /* Tipos de Contrato */
  function cfgTContrato(){
    const rows=Cat.tiposContrato().map(t=>`<tr><td class="num">${E(t.id)}</td><td>${E(t.nome)}</td>
      <td style="text-align:right"><button class="icon-act edit" data-etc="${t.id}">✎</button><button class="icon-act del" data-dtc="${t.id}">🗑</button></td></tr>`);
    return `<div class="card"><div class="card-title" style="justify-content:space-between"><span>Tipos de Contrato (${Cat.tiposContrato().length})</span><button class="btn btn-sm btn-dark" id="addtc">+ Tipo de Contrato</button></div>
      ${UI.table(['ID','Nome','Ações'], rows)}</div>`;
  }
  function bindTContrato(){
    document.getElementById('addtc').onclick=()=>tcForm();
    document.querySelectorAll('[data-etc]').forEach(b=>b.onclick=()=>tcForm(Cat.tiposContrato().find(t=>t.id===b.dataset.etc)));
    document.querySelectorAll('[data-dtc]').forEach(b=>b.onclick=()=>{
      if(Store.all('contratos').some(c=>c.tipoContratoId===b.dataset.dtc)) return UI.toast('Tipo em uso por um contrato — não pode excluir.');
      if(confirm('Excluir tipo de contrato?')){ Store.remove('tiposContrato',b.dataset.dtc); UI.router(); }});
  }
  function tcForm(t){ t=t||{};
    UI.modal(`<div class="m-head"><h3>${t.id?'Editar':'Novo'} Tipo de Contrato</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body"><div class="field full"><label>Nome</label><input id="tc-nome" value="${E(t.nome||'')}"></div></div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button><button class="btn btn-primary" id="save">Salvar</button></div>`);
    document.getElementById('save').onclick=()=>{
      const nome=document.getElementById('tc-nome').value.trim(); if(!nome)return UI.toast('Informe o nome.');
      Store.upsert('tiposContrato',{id:t.id||Cat.nextTcId(),nome}); UI.close(); UI.router();
    };
  }

  /* Tipos de Documento (editor da matriz) */
  function cfgTDoc(){
    const rows=Cat.tiposDocumento().map(d=>`<tr>
      <td>${E(d.documento)}</td><td>${E(d.setor)}</td><td>${E(d.fase)}</td>
      <td>${d.validadeObrigatoria?B('Sim','b-ok'):B('Não','b-muted')}</td>
      <td>${(d.contratos||[]).length}</td>
      <td style="text-align:right"><button class="icon-act edit" data-etd="${d.id}">✎</button><button class="icon-act del" data-dtd="${d.id}">🗑</button></td></tr>`);
    return `<div class="card"><div class="card-title" style="justify-content:space-between"><span>Tipos de Documento (${Cat.tiposDocumento().length})</span><button class="btn btn-sm btn-dark" id="addtd">+ Tipo de Documento</button></div>
      ${UI.table(['Documento','Setor','Fase','Validade obrig.','Nº contratos','Ações'], rows)}</div>`;
  }
  function bindTDoc(){
    document.getElementById('addtd').onclick=()=>tdForm();
    document.querySelectorAll('[data-etd]').forEach(b=>b.onclick=()=>tdForm(Cat.byId(b.dataset.etd)));
    document.querySelectorAll('[data-dtd]').forEach(b=>b.onclick=()=>{ if(confirm('Excluir tipo de documento?')){ Store.remove('tiposDocumento',b.dataset.dtd); UI.router(); }});
  }
  function tdForm(d){ d=d||{setor:'SUPRIMENTOS',fase:'ATIVACAO',contratos:[]};
    const contratosHTML=Cat.tiposContrato().map(t=>`<label style="display:flex;align-items:center;gap:8px;font-size:12px;margin:3px 0"><input type="checkbox" class="td-c" value="${t.id}" ${(d.contratos||[]).indexOf(t.id)>=0?'checked':''}> ${E(t.nome)}</label>`).join('');
    const sel=(id,val,opts)=>`<select id="${id}">${opts.map(o=>`<option${val===o?' selected':''}>${o}</option>`).join('')}</select>`;
    UI.modal(`<div class="m-head"><h3>${d.id?'Editar':'Novo'} Tipo de Documento</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body">
        <div class="field full"><label>Documento</label><input id="td-nome" value="${E(d.documento||'')}"></div>
        <div class="field"><label>Setor</label>${sel('td-setor',d.setor,['SUPRIMENTOS','SESMT','DP'])}</div>
        <div class="field"><label>Fase</label>${sel('td-fase',d.fase,['ATIVACAO','PERIODICO','ENCERRAMENTO'])}</div>
        <div class="field"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="td-val" ${d.validadeObrigatoria?'checked':''}> Validade obrigatória</label></div>
        <div class="field"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="td-apr" ${d.apresentacaoObrigatoria!==false?'checked':''}> Apresentação obrigatória</label></div>
        <div class="field full"><label>Exigido nos tipos de contrato</label><div style="max-height:180px;overflow:auto;border:1px solid var(--line);border-radius:8px;padding:8px">${contratosHTML}</div></div>
      </div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button><button class="btn btn-primary" id="save">Salvar</button></div>`);
    document.getElementById('save').onclick=()=>{
      const nome=document.getElementById('td-nome').value.trim(); if(!nome)return UI.toast('Informe o documento.');
      const contratos=[].slice.call(document.querySelectorAll('.td-c:checked')).map(x=>x.value);
      Store.upsert('tiposDocumento',{id:d.id||Cat.nextTdId(),documento:nome,
        setor:document.getElementById('td-setor').value,fase:document.getElementById('td-fase').value,
        validadeObrigatoria:document.getElementById('td-val').checked,
        apresentacaoObrigatoria:document.getElementById('td-apr').checked,contratos});
      UI.close(); UI.router();
    };
  }

  /* Colaboradores (global) */
  function cfgColab(){
    const forn=Store.all('fornecedores'), contr=Store.all('contratos');
    const rows=Store.all('colaboradores').map(cl=>{
      const f=forn.find(x=>x.id===cl.fornecedorId)||{}, c=contr.find(x=>x.id===cl.contratoId)||{};
      return `<tr><td>${E(cl.matricula||'—')}</td><td>${E(cl.cpf||'—')}</td><td>${E(cl.nome)}</td><td>${E(cl.funcao||'—')}</td>
        <td>${E(f.fantasia||f.razao||'—')}</td><td>${E(c.numero||'—')}</td>
        <td style="text-align:right"><button class="icon-act edit" data-ecl="${cl.id}">✎</button><button class="icon-act del" data-dcl="${cl.id}">🗑</button></td></tr>`;
    });
    return `<div class="card"><div class="card-title" style="justify-content:space-between"><span>Colaboradores</span><button class="btn btn-sm btn-dark" id="addcl">+ Colaborador</button></div>
      ${UI.table(['Matrícula','CPF','Nome','Função','Terceirizada','Contrato','Ações'], rows)}</div>`;
  }
  function bindColab(){
    document.getElementById('addcl').onclick=()=>colabFormGlobal();
    document.querySelectorAll('[data-ecl]').forEach(b=>b.onclick=()=>colabFormGlobal(Store.get('colaboradores',b.dataset.ecl)));
    document.querySelectorAll('[data-dcl]').forEach(b=>b.onclick=()=>{ if(confirm('Excluir colaborador?')){ Store.remove('colaboradores',b.dataset.dcl); UI.router(); }});
  }
  function colabFormGlobal(cl){ cl=cl||{};
    const forn=Store.all('fornecedores');
    const fopt=`<option value="">— selecione —</option>`+UI.option(forn.map(f=>({id:f.id,nome:f.fantasia||f.razao})),'id','nome',cl.fornecedorId);
    UI.modal(`<div class="m-head"><h3>${cl.id?'Editar':'Novo'} Colaborador</h3><button class="x-close" onclick="UI.close()">×</button></div>
      <div class="m-body">
        <div class="field"><label>Matrícula</label><input id="cl-mat" value="${E(cl.matricula||'')}"></div>
        <div class="field"><label>CPF</label><input id="cl-cpf" value="${E(cl.cpf||'')}"></div>
        <div class="field full"><label>Nome</label><input id="cl-nome" value="${E(cl.nome||'')}"></div>
        <div class="field"><label>Função</label><input id="cl-fun" value="${E(cl.funcao||'')}"></div>
        <div class="field"><label>Admissão</label><input type="date" id="cl-adm" value="${E(cl.admissao||'')}"></div>
        <div class="field"><label>Terceirizada</label><select id="cl-forn">${fopt}</select></div>
        <div class="field"><label>Contrato</label><select id="cl-contr"></select></div>
      </div>
      <div class="m-foot"><button class="btn" onclick="UI.close()">Cancelar</button><button class="btn btn-primary" id="save">Salvar</button></div>`);
    const fornSel=document.getElementById('cl-forn'), contrSel=document.getElementById('cl-contr');
    function fillContr(){ const list=Store.where('contratos',c=>c.fornecedorId===fornSel.value);
      contrSel.innerHTML=`<option value="">— selecione —</option>`+UI.option(list.map(c=>({id:c.id,nome:c.numero+' · '+Logic.contratoNome(c.tipoContratoId)})),'id','nome',cl.contratoId); }
    fillContr(); fornSel.onchange=fillContr;
    document.getElementById('save').onclick=()=>{
      const nome=document.getElementById('cl-nome').value.trim(); if(!nome)return UI.toast('Informe o nome.');
      if(!fornSel.value||!contrSel.value)return UI.toast('Selecione terceirizada e contrato.');
      Store.upsert('colaboradores',{id:cl.id,nome,matricula:document.getElementById('cl-mat').value.trim(),
        cpf:document.getElementById('cl-cpf').value.trim(),funcao:document.getElementById('cl-fun').value.trim(),
        admissao:document.getElementById('cl-adm').value,fornecedorId:fornSel.value,contratoId:contrSel.value,ativo:true});
      UI.close(); UI.router();
    };
  }

  /* Banco & Sincronização */
  function cfgBanco(){
    const cfg=Store.getCfg();
    return `<div class="card"><div class="card-title">Banco de dados</div>
        <div style="padding:16px 18px" class="help">O banco é um arquivo JSON. Por padrão fica salvo <b>neste navegador</b>. Sincronize de graça com um <span class="code">db.json</span> em um repositório privado do GitHub (banco compartilhado).</div>
        <div class="filter-body">
          <div class="field"><button class="btn" id="exp">⬇ Exportar JSON</button></div>
          <div class="field"><button class="btn" id="imp">⬆ Importar JSON</button><input type="file" id="impf" accept=".json" class="hidden"></div>
          <div class="field"><button class="btn" id="seedbtn">🌱 Carregar dados de exemplo</button></div>
          <div class="field"><button class="btn" style="color:var(--err)" id="rst">🗑 Zerar banco</button></div>
        </div></div>
      <div class="card"><div class="filter-head">🔗 Sincronização GitHub (gratuita)</div>
        <div class="filter-body">
          <div class="field"><label>Owner (usuário/org)</label><input id="g-owner" value="${E(cfg.owner||'')}"></div>
          <div class="field"><label>Repositório</label><input id="g-repo" value="${E(cfg.repo||'')}"></div>
          <div class="field"><label>Branch</label><input id="g-branch" value="${E(cfg.branch||'main')}"></div>
          <div class="field"><label>Caminho do arquivo</label><input id="g-path" value="${E(cfg.path||'db.json')}"></div>
          <div class="field full"><label>Token (fine-grained, Contents: read/write) — fica só na sessão</label><input id="g-tok" type="password" placeholder="github_pat_..." value="${E(Store.getToken())}"></div>
        </div>
        <div style="padding:0 18px 16px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" id="g-save">Salvar config</button>
          <button class="btn btn-dark" id="g-pull">⬇ Baixar do GitHub</button>
          <button class="btn btn-primary" id="g-push">⬆ Enviar para o GitHub</button>
        </div>
        <div class="help" style="padding:0 18px 16px">Use um <b>repositório privado</b> só para o db.json e um <b>token fine-grained</b> restrito a ele.</div>
      </div>`;
  }
  function bindBanco(){
    document.getElementById('exp').onclick=()=>{ const blob=new Blob([Store.exportJSON()],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='db.json'; a.click(); };
    document.getElementById('imp').onclick=()=>document.getElementById('impf').click();
    document.getElementById('impf').onchange=e=>{ const fr=new FileReader();
      fr.onload=()=>{ try{ Store.importJSON(fr.result); UI.toast('Importado ✓'); UI.router(); }catch(err){ UI.toast('Erro: '+err.message); } };
      fr.readAsText(e.target.files[0]); };
    document.getElementById('seedbtn').onclick=()=>{ window.Seed&&window.Seed.demo(); UI.toast('Dados de exemplo carregados ✓'); UI.router(); };
    document.getElementById('rst').onclick=()=>{ if(confirm('Isso apaga todos os dados locais. Continuar?')){ Store.reset(); location.reload(); }};
    document.getElementById('g-save').onclick=()=>{ Store.setCfg({owner:v('g-owner'),repo:v('g-repo'),branch:v('g-branch')||'main',path:v('g-path')||'db.json'});
      Store.setToken(v('g-tok')); UI.toast('Config salva ✓'); };
    document.getElementById('g-pull').onclick=async()=>{ try{ await Store.pull(); UI.toast('Baixado ✓'); UI.router(); }catch(e){ UI.toast(e.message); } };
    document.getElementById('g-push').onclick=async()=>{ try{ await Store.push(); UI.toast('Enviado ✓'); }catch(e){ UI.toast(e.message); } };
    function v(id){ return document.getElementById(id).value.trim(); }
  }

  return { render, bindDocsContrato };
})();
