(function(){
  'use strict';

  /* Recognition-first /new overlay. Keep one icon vocabulary at every camera zoom. */
  const V23_CATEGORIES=[
    {id:'transport',label:'Vei og buss',icon:'R',items:[['R','Vei'],['A','Sti'],['BUS','Buss']]},
    {id:'buildings',label:'Bygg',icon:'H',items:[['H','Hus'],['O','Kontor'],['S','Butikk'],['M','Gård'],['K','Skole']]},
    {id:'park',label:'Park',icon:'P',items:[['E','Gress'],['P','Løvtre'],['T','Bartre'],['B','Benk'],['G','Karusell'],['F','Fontene'],['W','Vann']]}
  ];
  const V23_EMO={
    H:'🏠',O:'🏢',S:'🏪',K:'🏫',R:'🛣️',A:'〰️',E:'🌱',P:'🌳',T:'🌲',G:'🎠',F:'⛲',W:'💧',BUS:'🚌'
  };
  const V23_NEED={
    '🏠':'H','🏢':'O','🛍️':'S','🏪':'S','🏫':'K','🛖':'M','🚜':'M','🛣️':'R',
    '🌳':'P','🌲':'T','🎠':'G','⛲':'F','🪑':'B','💧':'W'
  };
  let v23Category=null;

  function svgEl(markup,cls,viewBox='0 0 100 100'){
    const wrap=document.createElement('span');
    wrap.innerHTML='<svg class="'+cls+'" viewBox="'+viewBox+'" aria-hidden="true" focusable="false">'+markup+'</svg>';
    return wrap.firstElementChild;
  }
  function v23Barn(cls){
    return svgEl(
      '<path d="M16 43 L50 13 L84 43 V88 H16Z" fill="#c9433f" stroke="#7c2f2c" stroke-width="5" stroke-linejoin="round"/>'+
      '<path d="M13 44 L50 10 L87 44" fill="none" stroke="#6f342f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<rect x="31" y="52" width="38" height="36" rx="2" fill="#c9433f" stroke="#fff5e6" stroke-width="5"/>'+
      '<path d="M34 55 L66 85 M66 55 L34 85" stroke="#fff5e6" stroke-width="6" stroke-linecap="round"/>'+
      '<rect x="43" y="30" width="14" height="13" rx="2" fill="#fff5e6" stroke="#7c2f2c" stroke-width="3"/>',cls);
  }
  function v23Bench(cls){
    return svgEl(
      '<path d="M18 42 H82 V55 H18Z" fill="#9b623d" stroke="#603d29" stroke-width="5" stroke-linejoin="round"/>'+
      '<rect x="20" y="60" width="60" height="12" rx="4" fill="#bd7948" stroke="#603d29" stroke-width="4"/>'+
      '<path d="M29 70 V88 M71 70 V88" stroke="#603d29" stroke-width="8" stroke-linecap="round"/>',cls);
  }
  function v23PathIcon(cls){
    return svgEl('<path d="M8 68 Q29 26 49 50 Q67 70 92 31" fill="none" stroke="#b9945c" stroke-width="28" stroke-linecap="round"/><path d="M8 68 Q29 26 49 50 Q67 70 92 31" fill="none" stroke="#f2dfb7" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 9"/>',cls);
  }
  function v23RoadIcon(cls){
    return svgEl('<rect x="6" y="27" width="88" height="46" rx="10" fill="#626b6e" stroke="#3f484b" stroke-width="4"/><path d="M18 50 H82" stroke="#f5efc9" stroke-width="7" stroke-linecap="round" stroke-dasharray="13 11"/>',cls);
  }
  function v23GrassIcon(cls){
    return svgEl('<path d="M13 83 Q22 55 34 80 Q46 46 57 79 Q70 48 82 80 Q89 62 93 83Z" fill="#5fae57"/><path d="M29 79 Q31 61 37 55 M59 78 Q63 57 71 51" stroke="#327d3f" stroke-width="6" stroke-linecap="round"/>',cls);
  }
  function v23WaterIcon(cls){
    return svgEl('<path d="M50 10 C67 32 82 48 82 65 A32 32 0 1 1 18 65 C18 48 33 32 50 10Z" fill="#48a9d0" stroke="#257ba3" stroke-width="5"/>',cls);
  }
  function v23Symbol(type,cls='v23-symbol'){
    if(type==='M')return v23Barn(cls+' v23-svg-symbol');
    if(type==='B')return v23Bench(cls+' v23-svg-symbol');
    if(type==='A')return v23PathIcon(cls+' v23-svg-symbol');
    if(type==='R')return v23RoadIcon(cls+' v23-svg-symbol');
    if(type==='E')return v23GrassIcon(cls+' v23-svg-symbol');
    if(type==='W')return v23WaterIcon(cls+' v23-svg-symbol');
    const s=document.createElement('span');s.className=cls+' v23-emoji-symbol';s.textContent=V23_EMO[type]||'•';s.setAttribute('aria-hidden','true');return s;
  }

  function v23ToolCategory(tool){return V23_CATEGORIES.find(c=>c.items.some(x=>x[0]===tool))||null;}
  function v23SelectTool(k){
    if(k==='BUS'&&citLock)return;
    sfx('click');citTool=k;
    if(k==='BUS')citBusSelectedLine=null;else citBusMessage='';
    citRenderTools();citRenderHelp();citRenderBusNetwork();
  }
  function v23ToolButton(type,label,selected){
    const b=document.createElement('button');b.className='v23-tool-btn'+(selected?' sel':'');
    b.appendChild(v23Symbol(type,'v23-tool-icon'));b.title=label;b.setAttribute('aria-label',label);return b;
  }
  function v23RenderTools(){
    const tb=$('#cit-tools');if(!tb)return;
    const gc=$('#g-cit');if(gc&&(gc.classList.contains('v18-sim')||gc.classList.contains('v18-dim')))return;
    tb.innerHTML='';tb.className='v23-tools';
    const current=v23ToolCategory(citTool);if(!v23Category)v23Category=current?current.id:'buildings';

    const cats=document.createElement('div');cats.className='v23-category-col';
    V23_CATEGORIES.forEach(cat=>{
      const b=v23ToolButton(cat.icon,cat.label,!!(current&&current.id===cat.id));
      if(v23Category===cat.id)b.classList.add('category-open');
      b.addEventListener('click',()=>{v23Category=cat.id;v23RenderTools();});cats.appendChild(b);
    });
    const sep=document.createElement('div');sep.className='v23-edit-sep';cats.appendChild(sep);
    const broom=document.createElement('button');broom.className='v23-tool-btn v23-broom'+(citTool==='X'?' sel':'');broom.textContent='🧹';broom.title='Fjern';broom.setAttribute('aria-label','Fjern');broom.addEventListener('click',()=>v23SelectTool('X'));cats.appendChild(broom);
    const undo=document.createElement('button');undo.id='cit-undo';undo.className='v23-tool-btn v23-undo';undo.textContent='↶';undo.title='Angre';undo.setAttribute('aria-label','Angre');undo.disabled=!citUndo.length||citLock;
    undo.addEventListener('click',()=>{if(citLock||!citUndo.length)return;sfx('pop');const state=citUndo.pop();citRestore(state);if(S.cityArchivePending){S.cityArchivePending=false;save();}citResetHelp();});cats.appendChild(undo);

    const content=document.createElement('div');content.className='v23-content-col';
    const cat=V23_CATEGORIES.find(c=>c.id===v23Category)||V23_CATEGORIES[1];
    cat.items.forEach(([k,label])=>{
      const b=v23ToolButton(k,label,citTool===k);
      const price=Number(CITY_CFG.PRICE[k])||0;if(price){const p=document.createElement('span');p.className='v23-price';p.textContent=price;b.appendChild(p);}
      b.addEventListener('click',()=>v23SelectTool(k));content.appendChild(b);
    });
    tb.append(cats,content);
    v23EnsureLayout();
    requestAnimationFrame(()=>{if($('#g-cit')&&$('#g-cit').classList.contains('active')&&typeof citFitBoard==='function')citFitBoard();});
  }
  if(typeof citRenderTools==='function')citRenderTools=v23RenderTools;

  function v23MapSymbol(type){
    const wrap=document.createElement('span');wrap.className='v23-map-symbol v23-map-'+type;
    wrap.appendChild(v23Symbol(type,'v23-map-glyph'));return wrap;
  }
  function v23DecorateTiles(){
    if(typeof cit==='undefined'||!cit||!Array.isArray(cit.g))return;
    const grid=$('#cit-grid');if(!grid)return;
    const symbolTypes=new Set(['H','O','S','M','K','P','T','B','F','G']);
    grid.querySelectorAll('.ct[data-i]').forEach(d=>{
      const i=Number(d.dataset.i),t=cit.g[i];if(!t)return;
      d.classList.add('v23-map','v23-type-'+t);d.style.setProperty('--v23-ts',(Number(citTs)||20)+'px');
      d.querySelectorAll(':scope > .v20-tile-svg,:scope > .v21-tile-svg,:scope > .v23-map-symbol').forEach(x=>x.remove());
      if(symbolTypes.has(t))d.appendChild(v23MapSymbol(t));
    });
  }

  function v23SharedType(el){
    return el&&((el.dataset&&el.dataset.v19Icon)||V23_NEED[(el.dataset&&el.dataset.v19Original)||el.textContent.trim()]);
  }
  function v23UpgradeShared(el){
    const type=v23SharedType(el);if(!el||!type)return;
    el.classList.add('v23-shared-icon');el.dataset.v19Icon=type;el.textContent='';
    el.querySelectorAll(':scope > .v20-shared-svg,:scope > .v21-shared-svg,:scope > .v23-shared-symbol').forEach(x=>x.remove());
    el.appendChild(v23Symbol(type,'v23-shared-symbol'));
  }
  function v23UpgradeSharedAll(root=document){
    root.querySelectorAll&&root.querySelectorAll('.v18-need-icon,.v18-stat-icon,.cit-thought-icon').forEach(v23UpgradeShared);
  }

  function v23StopSvg(){
    return svgEl(
      '<path d="M18 28 Q18 18 29 18 H71 Q82 18 82 28 V70 Q82 80 72 80 H28 Q18 80 18 70Z" fill="none" stroke="currentColor" stroke-width="10" stroke-linejoin="round"/>'+
      '<path d="M29 32 H71 V52 H29Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>'+
      '<path d="M31 65 H69" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>'+
      '<circle cx="31" cy="82" r="7" fill="currentColor"/><circle cx="69" cy="82" r="7" fill="currentColor"/>',
      'v23-stop-svg');
  }
  function v23DecorateBusStops(){
    const grid=$('#cit-grid');if(!grid||typeof cit==='undefined'||!cit)return;
    grid.querySelectorAll('.cit-bus-stop').forEach(d=>{
      let color='';const id=Number(d.dataset.line);try{color=typeof citBusColor==='function'?citBusColor(id):'';}catch(e){}
      if(!color)color=getComputedStyle(d).getPropertyValue('--bus-color').trim()||'#267ac5';
      d.classList.add('v23-stop');d.style.setProperty('--v23-line',color);
      d.style.borderWidth='0';d.style.borderColor='transparent';
      d.querySelectorAll(':scope > .v19-bus-glyph,:scope > .v21-stop-frame').forEach(x=>x.remove());
      let icon=d.querySelector(':scope > .v23-stop-icon');
      if(!icon){icon=document.createElement('span');icon.className='v23-stop-icon';icon.appendChild(v23StopSvg());d.appendChild(icon);}
    });
  }

  function v23EnsureLayout(){
    const city=$('#g-cit'),stage=city&&city.querySelector('.stage-wrap'),viewport=$('#cit-viewport');if(!city||!stage||!viewport)return;
    if(city.classList.contains('v31-layout'))return;
    let rail=$('#v23-rail');if(!rail){rail=document.createElement('div');rail.id='v23-rail';stage.insertBefore(rail,viewport);}
    let info=$('#v23-info');if(!info){info=document.createElement('div');info.id='v23-info';rail.appendChild(info);}
    const top=city.querySelector(':scope > .top-bar')||city.querySelector('.top-bar');
    const help=$('#cit-help'),right=$('#cit-right'),tools=$('#cit-tools'),spacer=$('#cit-safe-spacer');
    [top,help,right].forEach(n=>{if(n&&n.parentNode!==info)info.appendChild(n);});
    if(tools&&tools.parentNode!==rail)rail.appendChild(tools);
    if(spacer){spacer.style.display='none';if(spacer.parentNode!==rail)rail.appendChild(spacer);}
    city.classList.add('v23-layout');
  }

  function v23BoxNumber(v){const n=parseFloat(v);return Number.isFinite(n)?n:0;}
  function v23FitBoard(){
    v23EnsureLayout();
    const city=$('#g-cit'),stage=city&&city.querySelector('.stage-wrap'),rail=$('#v23-rail'),v=$('#cit-viewport'),g=$('#cit-grid');
    if(!city||!stage||!rail||!v||!g||typeof CITY_CFG==='undefined')return;
    const cs=getComputedStyle(stage),innerW=stage.clientWidth-v23BoxNumber(cs.paddingLeft)-v23BoxNumber(cs.paddingRight),innerH=stage.clientHeight-v23BoxNumber(cs.paddingTop)-v23BoxNumber(cs.paddingBottom);
    city.classList.toggle('v23-tight',innerH<380);
    city.classList.toggle('v23-micro',innerH<330);
    const rs=getComputedStyle(rail),gap=Math.max(2,v23BoxNumber(cs.columnGap||cs.gap));
    const railW=rail.offsetWidth+v23BoxNumber(rs.marginLeft)+v23BoxNumber(rs.marginRight);
    const availW=Math.max(40,innerW-railW-gap-2),availH=Math.max(40,innerH-2);
    const oldW=v.clientWidth||0,oldH=v.clientHeight||0;
    let focusX=.5,focusY=.5;
    try{if(oldW&&oldH&&typeof citCam!=='undefined'){focusX=(oldW/2-citCam.x)/(citCam.scale||1)/oldW;focusY=(oldH/2-citCam.y)/(citCam.scale||1)/oldH;}}catch(e){}
    const byW=Math.floor(availW/CITY_CFG.COLS),byH=Math.floor(availH/CITY_CFG.ROWS);
    citTs=Math.max(4,Math.min(byW,byH));
    const bw=CITY_CFG.COLS*citTs,bh=CITY_CFG.ROWS*citTs;
    v.style.width=bw+'px';v.style.height=bh+'px';g.style.width=bw+'px';g.style.height=bh+'px';
    g.style.backgroundSize=`${citTs}px ${citTs}px, ${citTs}px ${citTs}px, ${citTs}px ${citTs}px`;
    try{
      if(oldW&&oldH&&typeof citCam!=='undefined'&&citCam.scale>1){citCam.x=bw/2-focusX*bw*citCam.scale;citCam.y=bh/2-focusY*bh*citCam.scale;}
      if(typeof citApplyCamera==='function')citApplyCamera();
    }catch(e){}
    g.querySelectorAll('.ct[data-i]').forEach(d=>d.style.setProperty('--v23-ts',citTs+'px'));
  }
  if(typeof citFitBoard==='function')citFitBoard=v23FitBoard;

  if(typeof citRenderBusNetwork==='function'){
    const base=citRenderBusNetwork;citRenderBusNetwork=function(){const r=base.apply(this,arguments);v23DecorateBusStops();return r;};
  }
  if(typeof citRenderTiles==='function'){
    const base=citRenderTiles;citRenderTiles=function(){const r=base.apply(this,arguments);v23DecorateTiles();v23DecorateBusStops();return r;};
  }
  if(typeof citRenderHelp==='function'){
    const base=citRenderHelp;citRenderHelp=function(){const r=base.apply(this,arguments);queueMicrotask(()=>v23UpgradeSharedAll($('#g-cit')||document));return r;};
  }
  if(typeof citSetThought==='function'){
    const base=citSetThought;citSetThought=function(el,icon){const r=base.call(this,el,icon);queueMicrotask(()=>{if(el){const g=el.querySelector('.cit-thought-icon');if(g)v23UpgradeShared(g);}});return r;};
  }

  const city=$('#g-cit');if(city){
    let queued=false;
    const obs=new MutationObserver(muts=>{
      let tiles=false,bus=false,shared=false,layout=false;
      for(const m of muts)for(const n of m.addedNodes||[]){
        if(n.nodeType!==1)continue;
        if(n.matches&&n.matches('.ct'))tiles=true;
        if((n.matches&&n.matches('.cit-bus-stop'))||(n.querySelector&&n.querySelector('.cit-bus-stop')))bus=true;
        if((n.matches&&n.matches('.v18-need-icon,.v18-stat-icon,.cit-thought-icon'))||(n.querySelector&&n.querySelector('.v18-need-icon,.v18-stat-icon,.cit-thought-icon')))shared=true;
        if((n.matches&&n.matches('.stage-wrap,#cit-tools,#cit-right,#cit-help'))||(n.querySelector&&n.querySelector('.stage-wrap,#cit-tools,#cit-right,#cit-help')))layout=true;
      }
      if(!(tiles||bus||shared||layout)||queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;if(layout)v23EnsureLayout();if(tiles)v23DecorateTiles();if(bus)v23DecorateBusStops();if(shared)v23UpgradeSharedAll(city);});
    });obs.observe(city,{childList:true,subtree:true});
  }

  let resizeQueued=false;
  const v23Resize=()=>{if(resizeQueued)return;resizeQueued=true;requestAnimationFrame(()=>{resizeQueued=false;if($('#g-cit')&&$('#g-cit').classList.contains('active')){v23FitBoard();if(typeof citRenderTiles==='function')citRenderTiles();if(typeof citRenderPeople==='function')citRenderPeople();if(typeof citRenderBusNetwork==='function')citRenderBusNetwork();}});};
  addEventListener('resize',v23Resize,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(v23Resize,80),{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',v23Resize,{passive:true});

  v23EnsureLayout();v23DecorateTiles();v23DecorateBusStops();v23UpgradeSharedAll();
  if(city&&city.classList.contains('active')){v23RenderTools();requestAnimationFrame(v23FitBoard);}
})();