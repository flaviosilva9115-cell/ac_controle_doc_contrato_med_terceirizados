/* =====================================================================
   auth.js — controle de acesso por obra
   Cada usuário tem obras='all' ou uma lista de ids de obra.
   ===================================================================== */
window.Auth = (function(){
  const user = () => window.__user || null;
  const isAdmin = () => { const u=user(); return !!u && (u.admin===true || u.perfil==='GESTOR'); };
  function allowedObraIds(){
    const u=user(); if(!u || u.obras==='all' || !Array.isArray(u.obras)) return null; // null = todas
    return u.obras;
  }
  const canObra = id => { const a=allowedObraIds(); return !a || a.indexOf(id)>=0; };
  const filterObras = list => { const a=allowedObraIds(); return a? list.filter(o=>a.indexOf(o.id)>=0) : list; };
  const filterContratos = list => { const a=allowedObraIds(); return a? list.filter(c=>a.indexOf(c.obraId)>=0) : list; };
  return { user, isAdmin, allowedObraIds, canObra, filterObras, filterContratos };
})();
