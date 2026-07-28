/* =====================================================================
   catalog.js — catálogos editáveis (Tipos de Contrato e Tipos de Documento)
   Semeados a partir da matriz (window.SEED) na primeira execução;
   depois passam a ser editáveis pelo usuário (Store).
   ===================================================================== */
window.Cat = (function(){
  function ensureSeed(){
    var S=window.SEED;
    if(Store.all('tiposContrato').length===0){
      S.tiposContrato.forEach(c=>Store.upsert('tiposContrato',{id:c.id,nome:c.nome}));
    }
    if(Store.all('tiposDocumento').length===0){
      S.tiposDocumento.forEach(d=>Store.upsert('tiposDocumento',Object.assign({},d,{contratos:(d.contratos||[]).slice()})));
    }
  }
  const tiposContrato = ()=>Store.all('tiposContrato');
  // Migração única: documentos de SUPRIMENTOS deixam de ter validade/apresentação
  // obrigatórias por padrão — o usuário passa a marcar manualmente. Roda uma vez.
  function migrateSuprimentos(){
    const db=Store.raw(); db.meta=db.meta||{};
    if(db.meta.migSupr) return;
    Store.all('tiposDocumento').forEach(d=>{
      if(d.setor==='SUPRIMENTOS'){ d.validadeObrigatoria=false; d.apresentacaoObrigatoria=false; Store.upsert('tiposDocumento',d); }
    });
    db.meta.migSupr=true; Store.save();
  }
  const tiposDocumento = ()=>Store.all('tiposDocumento');
  const contratoNome = id => (tiposContrato().find(c=>c.id===id)||{}).nome || id;
  function byId(id){ return tiposDocumento().find(d=>d.id===id)||null; }
  function docsDoTipo(tipoContratoId){ return tiposDocumento().filter(d=>(d.contratos||[]).indexOf(tipoContratoId)>=0); }
  function nextTcId(){ let n=1; const ids=tiposContrato().map(c=>c.id);
    while(ids.indexOf('tc'+String(n).padStart(2,'0'))>=0) n++; return 'tc'+String(n).padStart(2,'0'); }
  function nextTdId(){ let n=1; const ids=tiposDocumento().map(d=>d.id);
    while(ids.indexOf('td'+String(n).padStart(2,'0'))>=0) n++; return 'td'+String(n).padStart(2,'0'); }
  return { ensureSeed, migrateSuprimentos, tiposContrato, tiposDocumento, contratoNome, byId, docsDoTipo, nextTcId, nextTdId };
})();
