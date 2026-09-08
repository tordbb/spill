(function(){
  'use strict';

  const q=s=>document.querySelector(s);
  const DEFAULT_ZOOM=1.8;
  let migratingSmallBoard=false;

  function nativePortrait(){
    const c=q('#g-cit');
    return !!(c&&c.classList.contains('v2-portrait')&&getComputedStyle(c).transform==='none');
  }

  function ensureSupportedBoard(){
    let changed=false;
    try{
      if(typeof CITY_SIZES!=='undefined'&&CITY_SIZES&&CITY_SIZES.S){
        delete CITY_SIZES.S;
        changed=true;
      }
      if(typeof S!=='undefined'&&S){
        if(!S.citySettings)S.citySettings={};
        if(S.citySettings.size==='S'){
          S.citySettings.size='M';
          changed=true;
        }
      }

      /* If this overlay is ever applied while a legacy 15x10 city is already
         loaded, migrate it immediately. On normal page load changing the saved
         setting above makes openCit() perform the same migration before render. */
      if(!migratingSmallBoard&&typeof cit!=='undefined'&&cit&&typeof citInferDims==='function'&&typeof citResizeState==='function'){
        const dims=citInferDims(cit);
        if(dims&&dims[0]===15&&dims[1]===10&&CITY_SIZES&&CITY_SIZES.M){
          migratingSmallBoard=true;
          citResizeState(CITY_SIZES.M.cols,CITY_SIZES.M.rows);
          if(typeof S!=='undefined')S.city=cit;
          changed=true;
          migratingSmallBoard=false;
        }
      }

      const small=q('#cit-size-options .cit-size-btn[data-size="S"]');
      if(small)small.remove();
      const medium=q('#cit-size-options .cit-size-btn[data-size="M"] span:last-child');
      const large=q('#cit-size-options .cit-size-btn[data-size="L"] span:last-child');
      if(medium&&medium.textContent!=='20×30')medium.textContent='20×30';
      if(large&&large.textContent!=='40×60')large.textContent='40×60';
      if(changed&&typeof save==='function')save();
    }catch(_e){migratingSmallBoard=false;}
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
    if(clear.getAttribute('aria-label')!=='Tøm byen')clear.setAttribute('aria-label','Tøm byen');
    if(clear.title!=='Tøm byen')clear.title='Tøm byen';
    if(clear.dataset.v2SettingsClear!=='1'){
      clear.dataset.v2SettingsClear='1';
      clear.addEventListener('click',()=>{
        const settings=q('#cit-settings');
        if(settings)settings.classList.remove('show');
      },true);
    }
  }

  /* The portrait coordinate remap swaps the physical board dimensions. The bus
     polyline already uses remapped tile coordinates, so its SVG viewBox must use
     the rendered grid dimensions too. Otherwise the browser rescales the route
     independently and the highlighted path misses the actual road/bus stops. */
  function syncBusRouteViewBox(){
    const g=q('#cit-grid');if(!g)return;
    const w=parseFloat(g.style.width)||g.clientWidth||0;
    const h=parseFloat(g.style.height)||g.clientHeight||0;
    if(!w||!h)return;
    g.querySelectorAll('.cit-bus-route-layer').forEach(svg=>{
      const target=`0 0 ${w} ${h}`;
      if(svg.getAttribute('viewBox')!==target)svg.setAttribute('viewBox',target);
      if(svg.getAttribute('preserveAspectRatio')!=='none')svg.setAttribute('preserveAspectRatio','none');
    });
  }

  if(typeof citRenderBusNetwork==='function'&&!citRenderBusNetwork.__v2PolishWrapped){
    const base=citRenderBusNetwork;
    const wrapped=function(){
      const out=base.apply(this,arguments);
      syncBusRouteViewBox();
      return out;
    };
    wrapped.__v2PolishWrapped=true;
    citRenderBusNetwork=wrapped;
  }

  /* Native portrait rotates logical map coordinates CCW without rotating the DOM.
     Logical column 0 (the original left/start edge) is therefore the physical
     bottom of the portrait board. At zoom > 1, align that scaled bottom edge to
     the viewport bottom so the starter area remains the initial field of view. */
  function defaultCamera(){
    const v=q('#cit-viewport');
    let y=0;
    if(nativePortrait()&&v){
      const h=v.clientHeight||parseFloat(v.style.height)||0;
      if(h>0)y=h*(1-DEFAULT_ZOOM);
    }
    return {scale:DEFAULT_ZOOM,x:0,y};
  }

  function applyDefaultCamera(){
    if(typeof citCam==='undefined')return false;
    const next=defaultCamera();
    citCam.scale=next.scale;
    citCam.x=next.x;
    citCam.y=next.y;
    if(typeof citApplyCamera==='function')citApplyCamera();
    return true;
  }

  function primeDefaultCamera(){
    const c=q('#g-cit'),v=q('#cit-viewport');
    if(!c||c.dataset.v2DefaultCamera==='1'||!v||!v.clientWidth||!v.clientHeight)return false;
    if(!applyDefaultCamera())return false;
    c.dataset.v2DefaultCamera='1';
    return true;
  }

  if(typeof citFitBoard==='function'&&!citFitBoard.__v2PolishWrapped){
    const base=citFitBoard;
    const wrapped=function(){
      const out=base.apply(this,arguments);
      primeDefaultCamera();
      syncBusRouteViewBox();
      return out;
    };
    wrapped.__v2PolishWrapped=true;
    citFitBoard=wrapped;
  }

  if(typeof citResetCamera==='function'&&!citResetCamera.__v2PolishWrapped){
    const wrapped=function(){
      applyDefaultCamera();
    };
    wrapped.__v2PolishWrapped=true;
    citResetCamera=wrapped;
  }

  ensureSupportedBoard();
  installClearInSettings();

  if(typeof citSettingsRender==='function'&&!citSettingsRender.__v2PolishWrapped){
    const base=citSettingsRender;
    const wrapped=function(){
      ensureSupportedBoard();
      const out=base.apply(this,arguments);
      installClearInSettings();
      return out;
    };
    wrapped.__v2PolishWrapped=true;
    citSettingsRender=wrapped;
  }

  const city=q('#g-cit');
  if(city){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;queued=true;
      queueMicrotask(()=>{
        queued=false;
        ensureSupportedBoard();
        installClearInSettings();
        syncBusRouteViewBox();
      });
    });
    observer.observe(city,{childList:true,subtree:true});
  }

  requestAnimationFrame(()=>{
    try{if(typeof citFitBoard==='function')citFitBoard();}catch(_e){}
  });
  addEventListener('resize',()=>requestAnimationFrame(syncBusRouteViewBox),{passive:true});
  addEventListener('orientationchange',()=>setTimeout(syncBusRouteViewBox,80),{passive:true});
})();
