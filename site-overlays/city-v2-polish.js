(function(){
  'use strict';

  const q=s=>document.querySelector(s);

  function removeSmallBoard(){
    try{
      if(typeof CITY_SIZES!=='undefined' && CITY_SIZES && CITY_SIZES.S) delete CITY_SIZES.S;
      if(typeof S!=='undefined' && S){
        if(!S.citySettings)S.citySettings={};
        if(S.citySettings.size==='S')S.citySettings.size='M';
      }
      if(typeof CITY_CFG!=='undefined' && typeof CITY_SIZES!=='undefined' && CITY_SIZES.M){
        if(typeof S!=='undefined' && S.citySettings && S.citySettings.size==='M'){
          CITY_CFG.COLS=CITY_SIZES.M.cols;
          CITY_CFG.ROWS=CITY_SIZES.M.rows;
        }
      }
      const small=q('#cit-size-options .cit-size-btn[data-size="S"]');
      if(small)small.remove();
      const medium=q('#cit-size-options .cit-size-btn[data-size="M"] span:last-child');
      const large=q('#cit-size-options .cit-size-btn[data-size="L"] span:last-child');
      if(medium)medium.textContent='20×30';
      if(large)large.textContent='40×60';
      try{if(typeof save==='function')save();}catch(_e){}
    }catch(_e){}
  }

  function installClearInSettings(){
    const card=q('#cit-settings-card'),close=q('#cit-settings-close'),clear=q('#cit-clear');
    if(!card||!close||!clear)return;
    let row=q('#v2-clear-setting');
    if(!row){
      row=document.createElement('div');
      row.id='v2-clear-setting';
      const label=document.createElement('span');
      label.id='v2-clear-setting-label';
      label.textContent='Tøm byen';
      row.appendChild(label);
      card.insertBefore(row,close);
    }
    if(clear.parentNode!==row)row.appendChild(clear);
    clear.setAttribute('aria-label','Tøm byen');
    clear.title='Tøm byen';
    if(clear.dataset.v2SettingsClear!=='1'){
      clear.dataset.v2SettingsClear='1';
      clear.addEventListener('click',()=>{
        const settings=q('#cit-settings');
        if(settings)settings.classList.remove('show');
      },true);
    }
  }

  removeSmallBoard();
  installClearInSettings();

  if(typeof citSettingsRender==='function' && !citSettingsRender.__v2PolishWrapped){
    const base=citSettingsRender;
    const wrapped=function(){
      removeSmallBoard();
      installClearInSettings();
      return base.apply(this,arguments);
    };
    wrapped.__v2PolishWrapped=true;
    citSettingsRender=wrapped;
  }

  const city=q('#g-cit');
  if(city){
    const observer=new MutationObserver(()=>{
      removeSmallBoard();
      installClearInSettings();
    });
    observer.observe(city,{childList:true,subtree:true});
  }
})();
