/* =====================================================================
   app.js — inicialização: login, roteador, dados de exemplo
   ===================================================================== */
(function(){
  // ---------- LOGIN ----------
  function renderLogin(){
    const el=document.getElementById('login');
    el.innerHTML=`
      <div class="login-hero">
        <div class="brand-name">AMORIM COUTINHO</div>
        <div class="brand-sub">INCORPORAÇÃO E CONSTRUÇÃO</div>
        <div class="slogan">O melhor do amanhã, hoje.</div>
        <div class="mvv">
          <h4>MISSÃO</h4>Construir um mundo melhor onde a convivência, o bem estar e as relações humanas sejam fortalecidos.
          <h4>VISÃO</h4>Ser a organização mais admirada pela sua eficiência, sua rentabilidade e por respeito aos seus valores.
        </div>
        <div class="login-foot">Controle de Documentos de Terceirizadas · Desenvolvido por Facten Suprimentos · Amorim Coutinho © 2026</div>
      </div>
      <div class="login-box">
        <div class="logo">${UI.LOGO(46)}<div class="txt"><span class="a">AMORIM</span> <span class="c">COUTINHO</span><small>INCORPORAÇÃO E CONSTRUÇÃO</small></div></div>
        <label>E-mail / usuário</label><input id="lg-user" value="admin">
        <label>Senha</label><input id="lg-pass" type="password" value="admin">
        <button class="btn btn-primary" id="lg-btn">Entrar</button>
        <div class="login-hint">Padrão: admin / admin (crie usuários em Configurações)</div>
      </div>`;
    document.getElementById('lg-btn').onclick=doLogin;
    document.getElementById('lg-pass').addEventListener('keydown',e=>{ if(e.key==='Enter') doLogin(); });
  }
  function doLogin(){
    const u=document.getElementById('lg-user').value.trim(), p=document.getElementById('lg-pass').value;
    const user=Store.all('usuarios').find(x=>(x.login===u || x.email===u) && x.senha===p);
    if(!user){ UI.toast('Usuário ou senha inválidos.'); return; }
    window.__user=user; start(user);
  }

  function start(user){
    UI.renderShell(user);
    if(!location.hash || location.hash==='#/') location.hash='#/dashboard';
    route();
    window.addEventListener('hashchange', route);
  }
  function route(){
    UI.router();
    // binds da subtela "Documentos do Contrato"
    const parts=(location.hash.replace(/^#\/?/,'')||'').split('/');
    if(parts[0]==='contratos' && parts[1] && parts[1]!=='new'){
      Views.bindDocsContrato(parts[1]);
    }
  }

  // ---------- DADOS DE EXEMPLO ----------
  window.Seed = { demo(){
    if(!Store.all('obras').length){
      Store.upsert('obras',{codigo:'22',nome:'Residencial Cidade Jardim',cidade:'São Luís/MA'});
      Store.upsert('obras',{codigo:'07',nome:'Be Life Mossoró',cidade:'Mossoró/RN'});
    }
    let f=Store.all('fornecedores')[0];
    if(!f) f=Store.upsert('fornecedores',{cnpj:'12.736.749/0001-80',razao:'E R M SERVICO DE PINTURA E ACABAMENTO LTDA',fantasia:'ERM Pintura',ativo:true});
    const obra=Store.all('obras')[0];
    let c=Store.all('contratos')[0];
    if(!c) c=Store.upsert('contratos',{numero:'5908',fornecedorId:f.id,obraId:obra.id,
      tipoContratoId:'tc12', /* pintura interna/externa/fachada */ controleDoc:true,
      objeto:'CONTRATO REFERENTE A EXECUÇÃO DE SERVIÇOS DE PINTURA',obsMedicao:'MÃO DE OBRA REGISTRADA',
      dataContrato:'2025-01-01',dataInicio:'2025-01-01',dataTermino:'2025-12-31',ativo:true});
    if(!Store.all('colaboradores').length){
      const c1=Store.upsert('colaboradores',{fornecedorId:f.id,contratoId:c.id,nome:'José João Santos',matricula:'0154',cpf:'057.688.563-07',funcao:'Pintor',ativo:true});
      Store.upsert('colaboradores',{fornecedorId:f.id,contratoId:c.id,nome:'Adelson Pereira de Moura',matricula:'0953',cpf:'633.145.863-88',funcao:'Servente',ativo:true});
      // um doc aprovado e um vencido de exemplo para o colaborador 1
      const reqCol=Logic.checklistColaborador(c.tipoContratoId);
      if(reqCol[0]) Store.upsert('documentos',{tipoDocumentoId:reqCol[0].id,colaboradorId:c1.id,entregue:true,statusAprovacao:'APROVADO',validade:'2027-01-01',inseridoPor:'admin',inseridoEm:new Date().toISOString()});
    }
    // um doc de habilitação vencido (para ilustrar bloqueio de medição)
    const hab=Logic.habilitacao(c.tipoContratoId)[0];
    if(hab && !Logic.findInst(Store.all('documentos'),hab.id,c.id,null,null))
      Store.upsert('documentos',{tipoDocumentoId:hab.id,contratoId:c.id,entregue:true,statusAprovacao:'APROVADO',validade:'2024-12-31',inseridoPor:'admin',inseridoEm:new Date().toISOString()});
  }};

  Cat.ensureSeed();
  Cat.migrateSuprimentos();
  renderLogin();
})();
