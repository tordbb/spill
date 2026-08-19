(function(){
  'use strict';

  const V19_NEED_MAP={
    '🏠':'H','🏢':'O','🛍️':'S','🏪':'S','🏫':'K','🛖':'M','🚜':'M','🛣️':'R',
    '🌳':'P','🌲':'T','🎠':'G','⛲':'F','🪑':'B','💧':'W'
  };
  const V19_CATEGORIES=[
    {id:'road',label:'Vei',icon:'R',items:[['R','Vei'],['A','Sti'],['BUS','Buss']]},
    {id:'build',label:'Bygg',icon:'H',items:[['H','Hus'],['O','Kontor'],['M','Gård']]},
    {id:'service',label:'Tjenester',icon:'K',items:[['S','Butikk'],['K','Skole']]},
    {id:'nature',label:'Natur',icon:'T',items:[['E','Gress'],['P','Løvtre'],['T','Bartre'],['W','Vann']]},
    {id:'decor',label:'Pynt',icon:'F',items:[['B','Benk'],['G','Karusell'],['F','Fontene']]}
  ];
  let v19Category=null;

  function v19Glyph(type,cls='v19-tool-glyph'){
    const s=document.createElement('span');
    s.className=cls;s.dataset.v19Icon=type;return s;
  }
  function v19ToolCategory(tool){
    return V19_CATEGORIES.find(c=>c.items.some(i=>i[0]===tool))||null;
  }
  function v19SelectTool(k){
    if(k==='BUS'&&citLock)return;
    sfx('click');citTool=k;
    if(k==='BUS')citBusSelectedLine=null;else citBusMessage='';
    citRenderTools();citRenderHelp();citRenderBusNetwork();
  }

  function v19RenderTools(){
    const tb=$('#cit-tools');if(!tb)return;
    tb.innerHTML='';

    const broom=document.createElement('button');
    broom.className='v19-dock-btn v19-dock-broom'+(citTool==='X'?' sel':'');
    broom.innerHTML='🧹';broom.title='Fjern';broom.setAttribute('aria-label','Fjern');
    broom.addEventListener('click',()=>v19SelectTool('X'));tb.appendChild(broom);

    const undo=document.createElement('button');
    undo.id='cit-undo';undo.className='v19-dock-btn v19-dock-undo';undo.textContent='↶';
    undo.title='Angre';undo.setAttribute('aria-label','Angre');undo.disabled=!citUndo.length||citLock;
    undo.addEventListener('click',()=>{
      if(citLock||!citUndo.length)return;sfx('pop');const state=citUndo.pop();citRestore(state);
      if(S.cityArchivePending){S.cityArchivePending=false;save();}
      citResetHelp();
    });tb.appendChild(undo);

    const sep=document.createElement('div');sep.className='v19-dock-sep';tb.appendChild(sep);

    V19_CATEGORIES.forEach(cat=>{
      const b=document.createElement('button');
      const current=v19ToolCategory(citTool);
      b.className='v19-dock-btn'+((v19Category===cat.id||(current&&current.id===cat.id))?' sel':'');
      b.appendChild(v19Glyph(cat.icon));b.title=cat.label;b.setAttribute('aria-label',cat.label);
      b.addEventListener('click',()=>{v19Category=v19Category===cat.id?null:cat.id;v19RenderTools();});
      tb.appendChild(b);
    });

    const drawer=document.createElement('div');drawer.id='v19-tool-drawer';
    const cat=V19_CATEGORIES.find(c=>c.id===v19Category);
    if(cat){
      drawer.classList.add('show');
      const title=document.createElement('div');title.className='v19-drawer-title';
      const txt=document.createElement('span');txt.textContent=cat.label;title.appendChild(txt);
      const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label','Lukk');
      close.addEventListener('click',()=>{v19Category=null;v19RenderTools();});title.appendChild(close);drawer.appendChild(title);
      cat.items.forEach(([k,label])=>{
        const wrap=document.createElement('div');wrap.className='v19-tool-item';
        const b=document.createElement('button');b.className='v19-item-btn'+(citTool===k?' sel':'');
        b.appendChild(v19Glyph(k));b.title=label;b.setAttribute('aria-label',label);
        const price=Number(CITY_CFG.PRICE[k])||0;
        if(price){const p=document.createElement('span');p.className='v19-item-price';p.textContent='🪙'+price;b.appendChild(p);}
        b.addEventListener('click',()=>v19SelectTool(k));wrap.appendChild(b);
        const lab=document.createElement('div');lab.className='v19-item-label';lab.textContent=label;wrap.appendChild(lab);
        drawer.appendChild(wrap);
      });
    }
    tb.appendChild(drawer);

    requestAnimationFrame(()=>{
      if($('#g-cit')&&$('#g-cit').classList.contains('active')&&typeof citFitBoard==='function')citFitBoard();
    });
  }

  /* Replace the sprawling two-column tool catalogue with the compact category dock. */
  if(typeof citRenderTools==='function')citRenderTools=v19RenderTools;

  function v19DecorateTiles(){
    if(typeof cit==='undefined'||!cit||!Array.isArray(cit.g))return;
    const grid=$('#cit-grid');if(!grid)return;
    grid.querySelectorAll('.ct[data-i]').forEach(d=>{
      const i=Number(d.dataset.i),t=cit.g[i];if(!t)return;
      d.classList.add('v19-art','v19-type-'+t);
      d.style.setProperty('--v19-ts',(Number(citTs)||20)+'px');
      d.setAttribute('aria-label','');
    });
  }

  function v19Side(a,b){
    if(a==null||b==null||typeof citRC!=='function')return null;
    const [ar,ac]=citRC(a),[br,bc]=citRC(b),dr=br-ar,dc=bc-ac;
    if(dr===-1&&dc===0)return'top';if(dr===1&&dc===0)return'bottom';
    if(dr===0&&dc===-1)return'left';if(dr===0&&dc===1)return'right';return null;
  }
  function v19LinePaths(line){
    if(!line||typeof citBusLineModel!=='function')return[];
    const m=citBusLineModel(line);if(!m)return[];
    if(m.active&&Array.isArray(m.path))return[m.path];
    if(Array.isArray(m.components))return m.components.filter(c=>c&&Array.isArray(c.path)).map(c=>c.path);
    return Array.isArray(m.path)?[m.path]:[];
  }
  function v19ContinuationSides(line,stop){
    const sides=new Set();
    for(const path of v19LinePaths(line)){
      for(let k=0;k<path.length;k++)if(path[k]===stop){
        const a=k>0?v19Side(stop,path[k-1]):null,b=k+1<path.length?v19Side(stop,path[k+1]):null;
        if(a)sides.add(a);if(b)sides.add(b);
      }
    }
    return sides;
  }
  function v19DecorateBusStops(){
    const grid=$('#cit-grid');if(!grid||typeof cit==='undefined'||!cit)return;
    grid.querySelectorAll('.cit-bus-stop').forEach(d=>{
      const line=typeof citBusLineById==='function'?citBusLineById(Number(d.dataset.line)):null;
      const stop=Number(d.dataset.i),sides=v19ContinuationSides(line,stop);
      const color=line&&typeof citBusColor==='function'?citBusColor(line.id):(getComputedStyle(d).getPropertyValue('--bus-color').trim()||'#2878c7');
      const thick=Math.max(2,Math.round((Number(citTs)||12)*.16));
      d.classList.add('v19-stop');d.classList.toggle('v19-terminal',sides.size<=1);
      d.style.borderWidth=thick+'px';d.style.borderTopColor=sides.has('top')?'transparent':color;
      d.style.borderRightColor=sides.has('right')?'transparent':color;
      d.style.borderBottomColor=sides.has('bottom')?'transparent':color;
      d.style.borderLeftColor=sides.has('left')?'transparent':color;
      d.style.setProperty('--v19-stop-size',(Number(citTs)||20)+'px');
      d.querySelectorAll('.cit-bus-word,.cit-bus-end-word').forEach(x=>x.style.display='none');
      if(!d.querySelector('.v19-bus-glyph')){const g=document.createElement('span');g.className='v19-bus-glyph';d.appendChild(g);}
    });
  }

  if(typeof citRenderBusNetwork==='function'){
    const baseBusRender=citRenderBusNetwork;
    citRenderBusNetwork=function(){baseBusRender();v19DecorateBusStops();};
  }
  if(typeof citRenderTiles==='function'){
    const baseTileRender=citRenderTiles;
    citRenderTiles=function(){baseTileRender();v19DecorateTiles();v19DecorateBusStops();};
  }

  function v19UpgradeIconElement(el,icon){
    const type=V19_NEED_MAP[icon];if(!el||!type)return;
    if(el.dataset.v19Icon===type&&el.classList.contains('v19-shared-icon'))return;
    el.dataset.v19Original=icon;el.dataset.v19Icon=type;el.classList.add('v19-shared-icon');el.textContent='';
  }
  function v19UpgradeNeeds(){
    const main=$('#cit-help-main');if(!main)return;
    main.querySelectorAll('.v18-need-icon').forEach(el=>v19UpgradeIconElement(el,el.textContent.trim()||el.dataset.v19Original));
  }
  function v19UpgradeStats(){
    document.querySelectorAll('.v18-stat-icon').forEach(el=>v19UpgradeIconElement(el,el.textContent.trim()||el.dataset.v19Original));
  }

  if(typeof citSetThought==='function'){
    const baseSetThought=citSetThought;
    citSetThought=function(el,icon){
      baseSetThought(el,icon);
      if(icon&&el){const glyph=el.querySelector('.cit-thought-icon');if(glyph)v19UpgradeIconElement(glyph,icon);}
    };
  }

  const help=$('#cit-help-main');
  if(help){
    const obs=new MutationObserver(()=>v19UpgradeNeeds());obs.observe(help,{childList:true,subtree:true});
    v19UpgradeNeeds();
  }
  document.addEventListener('click',e=>{
    if(e.target&&e.target.closest&&e.target.closest('.v18-stats-button'))setTimeout(v19UpgradeStats,0);
  },true);

  /* Upgrade anything already on screen when the overlay loads. */
  v19DecorateTiles();v19DecorateBusStops();v19UpgradeStats();
  if($('#g-cit')&&$('#g-cit').classList.contains('active'))v19RenderTools();
})();
