/* =====================================================================
   logic.js — regras de negócio
   - situação (validade) e status (aprovação) de cada documento
   - geração do checklist a partir da matriz 26x59 (SEED)
   - portões: liberação de ENTRADA (colaborador) e de MEDIÇÃO (contrato)
   - montagem dos boletins
   ===================================================================== */
window.Logic = (function(){
  const C = window.Cat;
  const byId = id => C.byId(id);
  const contratoNome = id => C.contratoNome(id);

  const today = () => { const t=new Date(); t.setHours(0,0,0,0); return t; };
  function daysUntil(dateStr){
    if(!dateStr) return null;
    const d=new Date(dateStr+'T00:00:00'); return Math.round((d - today())/86400000);
  }
  const fmtDate = s => s ? s.split('-').reverse().join('/') : '—';

  // nível: EMPRESA (documento da empresa) ou COLABORADOR (por trabalhador)
  function nivel(d){
    if(d.setor==='SUPRIMENTOS') return 'EMPRESA';
    if(d.setor==='SESMT') return 'COLABORADOR';
    return d.fase==='ATIVACAO' ? 'COLABORADOR' : 'EMPRESA'; // DP
  }
  const SESMT_PESSOAL_NAOCERT = ['Ordem de Serviço','Ficha de EPI','Atestado'];
  function aba(d){ // qual aba da tela "Documentos do Contrato"
    if(nivel(d)==='COLABORADOR' && d.setor==='SESMT'){
      const pessoalNaoCert = SESMT_PESSOAL_NAOCERT.some(k=>d.documento.indexOf(k)>=0);
      return pessoalNaoCert ? 'COLABORADORES' : 'TREINAMENTOS';
    }
    if(nivel(d)==='COLABORADOR') return 'COLABORADORES'; // DP pessoais
    return d.fase; // ATIVACAO | PERIODICO | ENCERRAMENTO
  }

  // documentos exigidos por um tipo de contrato
  function docsDoTipo(tipoContratoId){ return C.docsDoTipo(tipoContratoId); }

  // ---- situação (validade) ----
  function situacao(inst, tdoc){
    if(!inst || !inst.entregue) return {key:'VAZIO', label:'Vazio', cls:'b-warn', dias:null};
    if(tdoc.validadeObrigatoria){
      const dias=daysUntil(inst.validade);
      if(dias===null) return {key:'VAZIO', label:'Sem validade', cls:'b-warn', dias:null};
      if(dias<0) return {key:'VENCIDO', label:'Vencido', cls:'b-err', dias};
      if(dias<=30) return {key:'A_VENCER', label:'A vencer', cls:'b-warn', dias};
    }
    return {key:'NORMAL', label:'Normal', cls:'b-ok', dias:tdoc.validadeObrigatoria?daysUntil(inst.validade):null};
  }
  const STATUS = {
    VAZIO:{label:'Vazio',cls:'b-muted'},
    ANEXOS_PENDENTES:{label:'Anexos Pendentes',cls:'b-pend'},
    AGUARDANDO:{label:'Aguardando Aprovação',cls:'b-warn'},
    APROVADO:{label:'Aprovado',cls:'b-ok'},
    REPROVADO:{label:'Reprovado',cls:'b-err'},
    PARCIAL:{label:'Parcialmente Aprovado',cls:'b-part'}
  };
  const statusInfo = s => STATUS[s]||STATUS.VAZIO;

  // instância de documento (Store.documentos) por chave
  function findInst(docs, tipoDocumentoId, contratoId, colaboradorId, periodo){
    return docs.find(x=> x.tipoDocumentoId===tipoDocumentoId
      && (x.contratoId||null)===(contratoId||null)
      && (x.colaboradorId||null)===(colaboradorId||null)
      && (x.periodo||null)===(periodo||null)) || null;
  }

  // ---- PORTÃO ENTRADA (colaborador) ----
  // libera se todos os docs COLABORADOR-level exigidos estão APROVADO e não vencidos
  function checklistColaborador(tipoContratoId){
    return docsDoTipo(tipoContratoId).filter(d=>nivel(d)==='COLABORADOR' && d.apresentacaoObrigatoria!==false);
  }
  function avaliaColaborador(colab, contrato, docs){
    const lista=checklistColaborador(contrato.tipoContratoId).map(td=>{
      const inst=findInst(docs, td.id, null, colab.id, null);
      const sit=situacao(inst, td);
      const st=(inst&&inst.statusAprovacao)||'VAZIO';
      const ok = st==='APROVADO' && sit.key!=='VENCIDO' && sit.key!=='VAZIO';
      return {td, inst, sit, st, ok};
    });
    const liberado = lista.length>0 && lista.every(x=>x.ok);
    return {lista, liberado};
  }

  // ---- PORTÃO MEDIÇÃO (contrato + período) ----
  // Regra: documentos de SUPRIMENTOS NÃO bloqueiam o pagamento. Bloqueiam apenas
  // os periódicos de DP/SESMT. Além disso, para validar o período o contrato não
  // pode ter pendência na liberação de entrada no canteiro (colaboradores).
  function checklistPeriodico(tipoContratoId){
    return docsDoTipo(tipoContratoId).filter(d=>d.fase==='PERIODICO' && nivel(d)==='EMPRESA'
      && d.setor!=='SUPRIMENTOS' && d.apresentacaoObrigatoria!==false);
  }
  function habilitacao(tipoContratoId){ // Suprimentos (CNDs/licenças) — informativo, NÃO bloqueia
    return docsDoTipo(tipoContratoId).filter(d=>d.fase==='ATIVACAO' && nivel(d)==='EMPRESA' && d.setor==='SUPRIMENTOS');
  }
  function checklistEncerramento(tipoContratoId){ // DP — documentos de encerramento
    return docsDoTipo(tipoContratoId).filter(d=>d.fase==='ENCERRAMENTO' && nivel(d)==='EMPRESA' && d.setor!=='SUPRIMENTOS' && d.apresentacaoObrigatoria!==false);
  }
  function contratoVigente(contrato){ return !contrato.dataTermino || daysUntil(contrato.dataTermino)>=0; }
  function avaliaMedicao(contrato, periodo, docs, colaboradores, modo){
    modo = modo || 'PERIODICO';
    const hab=habilitacao(contrato.tipoContratoId).map(td=>{
      const inst=findInst(docs, td.id, contrato.id, null, null);
      const sit=situacao(inst, td); const st=(inst&&inst.statusAprovacao)||'VAZIO';
      return {td, inst, sit, st, ok: st==='APROVADO'}; // informativo (não bloqueia)
    });
    if(modo==='ENCERRAMENTO'){
      const enc=checklistEncerramento(contrato.tipoContratoId).map(td=>{
        const inst=findInst(docs, td.id, contrato.id, null, null);
        const sit=situacao(inst, td); const st=(inst&&inst.statusAprovacao)||'VAZIO';
        return {td, inst, sit, st, ok: st==='APROVADO'};
      });
      const liberado = enc.length>0 && enc.every(x=>x.ok);
      return {modo, encerramento:enc, periodicos:[], habilitacao:hab, colabs:[], pendEntrada:[], entradaOk:true, vigente:true, liberado};
    }
    const per=checklistPeriodico(contrato.tipoContratoId).map(td=>{
      const inst=findInst(docs, td.id, contrato.id, null, periodo);
      const sit=situacao(inst, td); const st=(inst&&inst.statusAprovacao)||'VAZIO';
      return {td, inst, sit, st, ok: st==='APROVADO'};
    });
    const colabs=(colaboradores||[]).filter(cl=>cl.contratoId===contrato.id);
    const pendEntrada=colabs.filter(cl=>!avaliaColaborador(cl, contrato, docs).liberado);
    const entradaOk = pendEntrada.length===0;
    const vigente = contratoVigente(contrato);
    const perOk = per.every(x=>x.ok) && per.length>0;
    const liberado = perOk && vigente;
    return {modo, periodicos:per, encerramento:[], habilitacao:hab, colabs, pendEntrada, entradaOk, vigente, perOk, liberado};
  }

  // consolida status do contrato (para a lista de contratos)
  function statusContrato(contrato, docs){
    const req=docsDoTipo(contrato.tipoContratoId).filter(d=>d.setor==='SUPRIMENTOS');
    let apro=0, venc=0;
    req.forEach(td=>{
      const inst=findInst(docs, td.id, contrato.id, null, null);
      const sit=situacao(inst,td); const st=(inst&&inst.statusAprovacao)||'VAZIO';
      if(st==='APROVADO') apro++;
      if(sit.key==='VENCIDO') venc++;
    });
    const pct = req.length===0 ? 100 : Math.round(apro/req.length*100);
    return {total:req.length, aprovados:apro, vencidos:venc, pct};
  }

  // status de um período (competência 'YYYY-MM'): ABERTO por padrão
  function periodoStatus(competencia){
    const p=Store.all('periodos').find(x=>x.competencia===competencia);
    return p? p.status : 'ABERTO';
  }
  const periodoAberto = competencia => periodoStatus(competencia)!=='FECHADO';

  return {
    byId, contratoNome, contratoNomes:()=>C.tiposContrato(),
    daysUntil, fmtDate, nivel, aba, docsDoTipo,
    situacao, statusInfo, STATUS, findInst,
    checklistColaborador, avaliaColaborador,
    checklistPeriodico, habilitacao, checklistEncerramento, avaliaMedicao, statusContrato, contratoVigente,
    periodoStatus, periodoAberto
  };
})();
