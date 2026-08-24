(function(){
  'use strict';

  let scanQueued=false;
  let settingsBefore=null;
  let fallbackTimer=null;

  function q(sel,root=document){return root&&root.querySelector?root.querySelector(sel):null;}
  function qa(sel,root=document){return root&&root.querySelectorAll?[...root.querySelectorAll(sel)]:[];}
  function city(){return q('#g-cit');}
  function visible(el){
    if(!el||el===document.body||el===document.documentElement)return false;
    const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;
    const r=el.getBoundingClientRect();return r.width>2&&r.height>2&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight;
  }

  function svg(markup,cls){
    const span=document.createElement('span');
    span.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" class="'+cls+'">'+markup+'</svg>';
    return span.firstElementChild;
  }
  function catRoad(){
    return svg(
      '<path d="M36 10 H64 L86 92 H14Z" fill="#626b6e" stroke="#3f484b" stroke-width="5" stroke-linejoin="round"/>'+
      '<path d="M50 16 V30 M50 43 V58 M50 72 V88" stroke="#fff2c8" stroke-width="6" stroke-linecap="round"/>',
      'v26-category-svg v26-category-road');
  }
  function catRoof(){
    return svg(
      '<path d="M9 70 L50 26 L91 70" fill="#d8534f" stroke="#7b3532" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M66 39 V17 H78 V52" fill="#b96549" stroke="#7b3532" stroke-width="5" stroke-linejoin="round"/>',
      'v26-category-svg v26-category-roof');
  }
  function catPark(){
    return svg(
      '<path d="M8 82 Q50 70 92 82 V94 H8Z" fill="#62a953"/>'+
      '<path d="M27 78 V58 M51 78 V48 M75 78 V60" stroke="#765035" stroke-width="7" stroke-linecap="round"/>'+
      '<circle cx="27" cy="48" r="18" fill="#4f9d54" stroke="#36763c" stroke-width="4"/>'+
      '<circle cx="51" cy="35" r="22" fill="#5cac55" stroke="#36763c" stroke-width="4"/>'+
      '<circle cx="75" cy="50" r="17" fill="#438d4c" stroke="#326f39" stroke-width="4"/>',
      'v26-category-svg v26-category-park');
  }

  function decorateCategories(){
    const buttons=qa('#cit-tools .v23-category-col > .v23-tool-btn');
    const makers=[catRoad,catRoof,catPark];
    buttons.slice(0,3).forEach((b,i)=>{
      if(b.dataset.v26Category===String(i))return;
      const old=q(':scope > .v23-tool-icon',b);if(old)old.remove();
      b.prepend(makers[i]());b.dataset.v26Category=String(i);
    });
  }

  function directShopText(tile){
    let out='';
    for(const n of tile.childNodes){
      if(n.nodeType===Node.TEXT_NODE)out+=n.nodeValue||'';
    }
    return out.trim();
  }
  function decorateShops(){
    if(typeof cit==='undefined'||!cit||!Array.isArray(cit.g))return;
    qa('#cit-grid .ct[data-i]').forEach(tile=>{
      const i=Number(tile.dataset.i);if(cit.g[i]!=='S')return;
      tile.classList.add('v26-shop-original');
      qa(':scope > .v23-map-symbol.v23-map-S',tile).forEach(el=>el.remove());
      const txt=directShopText(tile);
      let fallback=q(':scope > .v26-shop-fallback',tile);
      if(txt){
        tile.classList.add('v26-shop-has-original');
        if(fallback)fallback.remove();
      }else if(!fallback){
        fallback=document.createElement('span');fallback.className='v26-shop-fallback';fallback.textContent='🛍️';tile.appendChild(fallback);
      }
    });
  }

  function updateLandScale(){
    const grid=q('#cit-grid');if(!grid)return;
    let ts=20;try{if(typeof citTs!=='undefined'&&Number(citTs)>0)ts=Number(citTs);}catch(e){}
    grid.style.setProperty('--v26-ts',ts+'px');
  }

  function panelCandidates(){
    return qa('dialog,[role="dialog"],[role="menu"],nav,aside,section,div').filter(el=>{
      if(!visible(el)||el.closest('#cit-grid,#cit-tools,#cit-v18-stats,#cit-clear-confirm'))return false;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      if(r.width<80||r.height<45)return false;
      if(!el.querySelector('button,input,select,[role="menuitem"]'))return false;
      const t=((el.id||'')+' '+(typeof el.className==='string'?el.className:'')+' '+(el.getAttribute('aria-label')||'')).toLowerCase();
      return el.matches('dialog,[role="dialog"],[role="menu"]')||/setting|innstill|menu|panel|popover|modal/.test(t)||s.position==='fixed'||s.position==='absolute';
    });
  }
  function snapshotPanels(){return new Set(panelCandidates());}
  function settingsScore(el){
    const s=getComputedStyle(el),r=el.getBoundingClientRect();
    const t=((el.id||'')+' '+(typeof el.className==='string'?el.className:'')+' '+(el.getAttribute('aria-label')||'')+' '+(el.textContent||'')).toLowerCase();
    let score=0;
    if(/setting|innstill/.test(t))score+=12;
    if(el.matches('dialog,[role="dialog"],[role="menu"]'))score+=7;
    if(/menu|panel|popover|modal/.test(t))score+=4;
    if(s.position==='fixed'||s.position==='absolute')score+=3;
    if(Number.parseInt(s.zIndex,10)>20)score+=2;
    score+=Math.min(3,(r.width*r.height)/(innerWidth*innerHeight)*5);
    return score;
  }
  function findOpenedSettings(){
    const all=panelCandidates();
    const fresh=all.filter(el=>!settingsBefore||!settingsBefore.has(el));
    const pool=fresh.length?fresh:all.filter(el=>/setting|innstill/.test(((el.id||'')+' '+(typeof el.className==='string'?el.className:'')+' '+(el.textContent||'')).toLowerCase()));
    return pool.map(el=>({el,score:settingsScore(el)})).sort((a,b)=>b.score-a.score)[0]?.el||null;
  }
  function deleteButton(){
    let b=q('#v26-delete-setting');if(b)return b;
    b=document.createElement('button');b.id='v26-delete-setting';b.type='button';b.className='v26-delete-setting';
    b.innerHTML='<span aria-hidden="true">🗑️</span><span>Slett byen</span>';
    b.setAttribute('aria-label','Slett byen');
    b.addEventListener('click',()=>{const original=q('#cit-clear');if(original)original.click();closeFallback();});
    return b;
  }
  function attachDelete(panel){
    if(!panel)return false;
    let row=q(':scope > .v26-settings-delete-row',panel);
    if(!row){row=document.createElement('div');row.className='v26-settings-delete-row';panel.appendChild(row);}
    const b=deleteButton();if(b.parentNode!==row)row.appendChild(b);
    const old=q('#v24-delete-setting');if(old&&old!==b)old.style.setProperty('display','none','important');
    closeFallback();return true;
  }
  function fallbackMenu(){
    const slot=q('#v25-nav-slot');if(!slot)return null;
    let m=q('#v26-settings-menu');
    if(!m){m=document.createElement('div');m.id='v26-settings-menu';m.setAttribute('role','menu');m.appendChild(deleteButton());slot.appendChild(m);}
    return m;
  }
  function closeFallback(){const m=q('#v26-settings-menu');if(m)m.classList.remove('show');}
  function openFallback(){const m=fallbackMenu();if(m)m.classList.add('show');}

  function onMenuPointer(){
    settingsBefore=snapshotPanels();
    clearTimeout(fallbackTimer);closeFallback();
    const tries=[70,180,360];
    tries.forEach((ms,idx)=>setTimeout(()=>{
      const panel=findOpenedSettings();
      if(panel){attachDelete(panel);return;}
      if(idx===tries.length-1)openFallback();
    },ms));
  }

  function repairTrash(){
    const old=q('#v24-settings-fallback');if(old)old.classList.remove('show');
    const panel=findOpenedSettings();if(panel)attachDelete(panel);
  }

  function scan(){
    scanQueued=false;
    const c=city();if(!c)return;c.classList.add('v26-polish');
    decorateCategories();decorateShops();updateLandScale();repairTrash();
  }
  function queueScan(){if(scanQueued)return;scanQueued=true;requestAnimationFrame(scan);}

  if(typeof citRenderTiles==='function'){
    const base=citRenderTiles;citRenderTiles=function(){const r=base.apply(this,arguments);queueMicrotask(()=>{decorateShops();updateLandScale();});return r;};
  }
  if(typeof citRenderTools==='function'){
    const base=citRenderTools;citRenderTools=function(){const r=base.apply(this,arguments);queueMicrotask(decorateCategories);return r;};
  }

  document.addEventListener('click',e=>{
    if(e.target&&e.target.closest&&e.target.closest('#v25-menu'))onMenuPointer();
    else if(!e.target.closest?.('#v26-settings-menu'))closeFallback();
  },true);

  const obs=new MutationObserver(queueScan);obs.observe(document.body,{childList:true,subtree:true});
  addEventListener('resize',queueScan,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',queueScan,{passive:true});
  queueScan();
})();
