(function(){
  'use strict';
  const script=document.currentScript;
  const role=script?.dataset.role||'home';
  const target=script?.dataset.target||'';
  const slug=script?.dataset.slug||'';

  const routes={
    'card-bal':'balance',
    'card-cre':'creature',
    'card-pat':'patterns',
    'card-wal':'walk',
    'card-sdk':'sudoku',
    'card-cit':'city'
  };
  const targets={
    balance:'g-bal',creature:'g-cre',patterns:'g-pat',walk:'g-wal',sudoku:'g-sdk',city:'g-cit'
  };

  function quietClicks(){
    try{
      if(typeof sfx==='function'&&!sfx.__newV31Quiet){
        const base=sfx;
        const wrapped=function(name){if(name==='click')return;return base.apply(this,arguments);};
        wrapped.__newV31Quiet=true;wrapped.__newV31Base=base;
        sfx=wrapped;try{window.sfx=wrapped;}catch(_e){}
      }
    }catch(_e){}
  }

  function homeUrl(){
    return role==='home' ? new URL('./',location.href) : new URL('../',location.href);
  }

  function prune(keep){
    document.querySelectorAll('.screen').forEach(el=>{if(el.id!==keep)el.remove();});
  }

  quietClicks();

  document.addEventListener('click',e=>{
    if(role==='home'){
      const card=e.target?.closest?.('.menu-card');
      const route=card&&routes[card.id];
      if(route){
        e.preventDefault();e.stopImmediatePropagation();
        location.assign(new URL('./'+route+'/',location.href).href);
        return;
      }
    }else{
      const back=e.target?.closest?.('.nav-home,#v25-exit');
      if(back){
        e.preventDefault();e.stopImmediatePropagation();
        location.replace(homeUrl().href);
      }
    }
  },true);

  if(role==='home'){
    requestAnimationFrame(()=>prune('home'));
    return;
  }

  const cardId=Object.keys(routes).find(id=>targets[routes[id]]===target);
  const card=cardId&&document.getElementById(cardId);
  if(card){
    try{card.click();}catch(_e){}
  }
  document.querySelectorAll('#'+target+' .nav-home').forEach(btn=>{
    btn.textContent='←';btn.setAttribute('aria-label','Tilbake');btn.title='Tilbake';
  });

  document.documentElement.dataset.newV31Game=slug||target;
  try{
    history.replaceState({newV31Game:true},'',location.href);
    history.pushState({newV31Guard:true},'',location.href);
    addEventListener('popstate',()=>location.replace(homeUrl().href),{once:true});
  }catch(_e){}
  requestAnimationFrame(()=>prune(target));
})();