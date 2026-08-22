(function(){
  'use strict';

  const V21_NEED_MAP={
    '🏠':'H','🏢':'O','🛍️':'S','🏪':'S','🏫':'K','🛖':'M','🚜':'M','🛣️':'R',
    '🌳':'P','🌲':'T','🎠':'G','⛲':'F','🪑':'B','💧':'W'
  };
  const V21_CATEGORIES=[
    {id:'transport',label:'Vei og buss',icon:'R',items:[['R','Vei'],['A','Sti'],['BUS','Buss']]},
    {id:'buildings',label:'Bygg',icon:'H',items:[['H','Hus'],['O','Kontor'],['S','Butikk'],['M','Gård'],['K','Skole']]},
    {id:'park',label:'Park',icon:'P',items:[['E','Gress'],['P','Løvtre'],['T','Bartre'],['B','Benk'],['G','Karusell'],['F','Fontene'],['W','Vann']]}
  ];
  const SHOP_COLORS=[
    ['#db5b68','#fff0d6','#f2bd4f'],['#4e96c0','#edf5e8','#f1b25a'],['#796bb5','#f5ead8','#ef7a67'],
    ['#489267','#f6e9c8','#e4af48'],['#d27b49','#fff0d8','#4ea2b6'],['#b75984','#f9e5d4','#6f9fca']
  ];
  let v21Category=null;

  function escText(s){return String(s==null?'':s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));}
  function svgEl(markup,cls){
    const wrap=document.createElement('span');
    wrap.innerHTML='<svg class="'+cls+'" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'+markup+'</svg>';
    return wrap.firstElementChild;
  }
  function v21Markup(type,variant=0,shopEmoji=''){
    const v=Math.abs(Number(variant)||0);
    if(type==='H'){
      const roofs=['#d75d58','#d88749','#668fc0','#b45f87','#6e9f68'];
      const walls=['#f2d2a0','#f4e1b6','#f0cfb7','#f5d6c0','#f2d6a5'];
      return '<ellipse cx="50" cy="84" rx="32" ry="7" fill="#23412c26"/>'+
        '<path d="M19 49 L47 22 Q51 18 56 22 L83 45 L79 83 H23Z" fill="'+walls[v%walls.length]+'"/>'+
        '<path d="M12 49 L45 17 Q51 11 58 18 L89 44 L79 52 L52 29 L23 55Z" fill="'+roofs[v%roofs.length]+'"/>'+
        '<rect x="43" y="59" width="17" height="25" rx="4" fill="#78533f"/>';
    }
    if(type==='O'){
      const fronts=['#6095b7','#667fb2','#5f9a91'];const sides=['#426c89','#485e8e','#44766f'];
      return '<ellipse cx="52" cy="88" rx="29" ry="6" fill="#213d2929"/>'+
        '<path d="M26 24 L65 14 L81 25 V82 L42 91 L26 80Z" fill="'+fronts[v%3]+'"/>'+
        '<path d="M65 14 L81 25 V82 L67 77Z" fill="'+sides[v%3]+'"/>'+
        '<path d="M26 24 L65 14 L81 25 L42 35Z" fill="#9ec6d9" opacity=".65"/>'+
        '<g fill="#dff5ff"><path d="M34 37 L61 31 V41 L34 47Z"/><path d="M34 53 L61 47 V57 L34 63Z"/><path d="M34 69 L61 63 V73 L34 79Z"/></g>'+
        '<path d="M67 31 L75 34 V45 L67 42Z M67 51 L75 54 V65 L67 62Z" fill="#b9d9e6"/>';
    }
    if(type==='K'){
      return '<ellipse cx="50" cy="87" rx="38" ry="6" fill="#213d2928"/>'+
        '<path d="M12 49 L27 38 H73 L89 49 V82 H12Z" fill="#efd8a4"/>'+
        '<path d="M8 49 L25 34 H75 L93 49 L86 55 L72 45 H29 L15 56Z" fill="#c95850"/>'+
        '<rect x="41" y="54" width="20" height="29" rx="4" fill="#5d8cab"/>'+
        '<circle cx="51" cy="45" r="8" fill="#fff4cf" stroke="#7d6547" stroke-width="3"/>'+
        '<path d="M51 37 V16" stroke="#66594c" stroke-width="4" stroke-linecap="round"/><path d="M53 17 Q66 17 72 24 Q64 30 53 27Z" fill="#f0c849"/>';
    }
    if(type==='M'){
      return '<ellipse cx="49" cy="89" rx="39" ry="6" fill="#213d2929"/>'+
        '<path d="M12 73 Q27 61 42 70 Q58 79 89 66 V89 H12Z" fill="#88bb62"/>'+
        '<path d="M18 48 L48 18 Q52 14 57 19 L82 47 V84 H19Z" fill="#c95246"/>'+
        '<path d="M12 49 L45 16 Q51 10 58 17 L88 48 L79 55 L52 30 L20 57Z" fill="#744034"/>'+
        '<rect x="38" y="56" width="25" height="28" rx="2" fill="#f4ddae"/><path d="M39 57 L62 83 M62 57 L39 83" stroke="#a55f4b" stroke-width="4"/>'+
        '<path d="M72 34 Q82 29 87 37 V78 H72Z" fill="#e1c47d"/><ellipse cx="79.5" cy="34" rx="7.5" ry="4" fill="#f0d89b"/>'+
        '<path d="M14 78 H31 M68 82 H91" stroke="#e7c54d" stroke-width="5" stroke-linecap="round" stroke-dasharray="4 4"/>';
    }
    if(type==='S'){
      const [awning,wall,accent]=SHOP_COLORS[v%SHOP_COLORS.length];const sign=escText(shopEmoji||'●');
      const roofStyle=v%3;
      const top=roofStyle===0?'<path d="M18 38 Q50 20 82 38" stroke="'+accent+'" stroke-width="10" stroke-linecap="round" fill="none"/>':
        roofStyle===1?'<path d="M20 39 L50 20 L82 39" fill="'+accent+'"/>':'<rect x="28" y="22" width="44" height="17" rx="8" fill="'+accent+'"/>';
      return '<ellipse cx="50" cy="88" rx="36" ry="6" fill="#213d2927"/>'+top+
        '<path d="M14 44 Q15 37 22 37 H79 Q86 37 87 44 V84 H14Z" fill="'+wall+'"/>'+
        '<path d="M10 44 H91 L87 55 Q80 61 73 53 Q66 61 59 53 Q51 61 44 53 Q37 61 30 53 Q22 61 15 54Z" fill="'+awning+'"/>'+
        '<rect x="22" y="61" width="35" height="19" rx="4" fill="#bde0e7"/><rect x="64" y="59" width="15" height="25" rx="4" fill="'+accent+'"/>'+
        '<circle cx="51" cy="31" r="12" fill="#fff7e8" stroke="'+awning+'" stroke-width="3"/>'+
        '<text x="51" y="32" text-anchor="middle" dominant-baseline="middle" font-size="18">'+sign+'</text>';
    }
    if(type==='P'){
      const g1=['#4d9950','#478e56','#5a9d49'][v%3],g2=['#72b65f','#67ab64','#80bd61'][v%3];
      return '<ellipse cx="51" cy="89" rx="23" ry="5" fill="#213d2927"/><path d="M47 59 Q51 50 56 60 L60 89 H42Z" fill="#795239"/>'+
        '<circle cx="33" cy="43" r="20" fill="'+g1+'"/><circle cx="55" cy="32" r="24" fill="'+g2+'"/><circle cx="70" cy="49" r="21" fill="'+g1+'"/>'+
        '<circle cx="48" cy="51" r="24" fill="'+g1+'" opacity=".92"/>';
    }
    if(type==='T'){
      return '<ellipse cx="50" cy="90" rx="20" ry="5" fill="#213d2927"/><rect x="45" y="66" width="11" height="24" rx="3" fill="#744e35"/>'+
        '<path d="M50 8 L79 48 H66 L84 70 H16 L34 48 H22Z" fill="#3c8555"/><path d="M50 20 L68 47 H58 L72 64 H29 L42 47 H33Z" fill="#5ca16a"/>';
    }
    if(type==='B'){
      return '<ellipse cx="51" cy="84" rx="35" ry="5" fill="#213d2925"/>'+
        '<path d="M17 43 Q18 38 24 38 H78 Q84 38 84 44 V55 H17Z" fill="#9c633d"/>'+
        '<rect x="20" y="59" width="62" height="12" rx="4" fill="#be7b48"/>'+
        '<path d="M28 69 V86 M73 69 V86" stroke="#71462f" stroke-width="8" stroke-linecap="round"/>';
    }
    if(type==='F'){
      return '<ellipse cx="50" cy="79" rx="39" ry="13" fill="#bddde1"/><ellipse cx="50" cy="74" rx="31" ry="12" fill="#5fb3d0"/>'+
        '<ellipse cx="50" cy="70" rx="18" ry="7" fill="#dff4f6"/>'+
        '<path d="M50 61 C33 47 42 28 50 17 C58 29 67 47 50 61Z" fill="#e9fbff"/><path d="M50 58 Q68 48 72 34" stroke="#e9fbff" stroke-width="6" fill="none" stroke-linecap="round"/>';
    }
    if(type==='G'){
      return '<ellipse cx="50" cy="86" rx="36" ry="7" fill="#213d2925"/>'+
        '<path d="M18 44 Q50 10 82 44Z" fill="#e5626c"/><path d="M31 44 Q50 15 50 13 Q51 17 69 44Z" fill="#f1cc55"/>'+
        '<rect x="47" y="43" width="7" height="41" rx="3" fill="#fff0cd"/>'+
        '<path d="M25 69 Q34 58 44 68 Q37 77 28 75Z" fill="#f5e3bd"/><circle cx="41" cy="64" r="4" fill="#f5e3bd"/><path d="M31 74 V84 M40 72 V83" stroke="#885846" stroke-width="3"/>'+
        '<path d="M57 66 Q66 55 76 66 Q69 75 60 73Z" fill="#dff0f1"/><circle cx="73" cy="61" r="4" fill="#dff0f1"/><path d="M62 72 V83 M71 70 V82" stroke="#657782" stroke-width="3"/>';
    }
    if(type==='Q'){
      return '<path d="M12 22 C29 30 36 68 25 88 M32 15 C49 26 54 68 44 91 M53 12 C67 25 74 66 65 88 M73 16 C84 29 89 64 82 82" stroke="#e2c267" stroke-width="7" fill="none" stroke-linecap="round"/>';
    }
    if(type==='R') return '<rect x="6" y="29" width="88" height="42" rx="7" fill="#646d70"/><path d="M18 50 H82" stroke="#f2edce" stroke-width="6" stroke-linecap="round" stroke-dasharray="12 10"/>';
    if(type==='A') return '<path d="M8 64 Q28 31 48 50 Q66 67 92 37" stroke="#cdb483" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M8 64 Q28 31 48 50 Q66 67 92 37" stroke="#ebd8ad" stroke-width="4" fill="none" stroke-dasharray="3 8"/>';
    if(type==='E') return '<path d="M12 82 Q20 58 31 78 Q42 51 53 77 Q67 48 78 77 Q87 61 91 82Z" fill="#75b85c"/><path d="M24 78 Q25 64 31 59 M57 77 Q61 58 69 53" stroke="#4b9150" stroke-width="5" stroke-linecap="round"/>';
    if(type==='W') return '<path d="M12 48 Q18 23 43 20 Q69 13 86 32 Q96 48 83 70 Q64 86 38 78 Q15 77 10 61Z" fill="#54afd1"/><path d="M24 43 Q38 35 52 42 T80 41 M20 61 Q35 53 49 60 T77 58" stroke="#a1dfef" stroke-width="5" fill="none" stroke-linecap="round"/>';
    if(type==='BUS') return '<path d="M14 31 Q15 23 24 22 H77 Q87 22 88 32 V68 Q88 76 80 76 H20 Q12 76 12 68Z" fill="#4d98cf"/><rect x="22" y="31" width="24" height="16" rx="4" fill="#e9f7fb"/><rect x="54" y="31" width="24" height="16" rx="4" fill="#e9f7fb"/><circle cx="29" cy="77" r="8" fill="#334952"/><circle cx="72" cy="77" r="8" fill="#334952"/>';
    return '';
  }
  function v21Svg(type,variant=0,shopEmoji='',cls='v21-tile-svg'){return svgEl(v21Markup(type,variant,shopEmoji),cls);}
  function v21ShopEmoji(i){
    try{const a=CITY_CFG&&Array.isArray(CITY_CFG.SHOP_TYPES)?CITY_CFG.SHOP_TYPES:[];return a.length?a[(Number(cit.st&&cit.st[i])||0)%a.length]:'';}catch(e){return '';}
  }
  function v21Variant(i,type){return type==='S'?(Number(cit.st&&cit.st[i])||0):((Number(i)||0)*11+(type?type.charCodeAt(0):0));}

  function v21ToolCategory(tool){return V21_CATEGORIES.find(c=>c.items.some(x=>x[0]===tool))||null;}
  function v21SelectTool(k){
    if(k==='BUS'&&citLock)return;
    sfx('click');citTool=k;
    if(k==='BUS')citBusSelectedLine=null;else citBusMessage='';
    citRenderTools();citRenderHelp();citRenderBusNetwork();
  }
  function v21ToolButton(type,label,selected,variant=0,shopEmoji=''){
    const b=document.createElement('button');b.className='v21-tool-btn'+(selected?' sel':'');
    b.appendChild(v21Svg(type,variant,shopEmoji,'v21-tool-svg'));b.title=label;b.setAttribute('aria-label',label);return b;
  }
  function v21RenderTools(){
    const tb=$('#cit-tools');if(!tb)return;
    const gc=$('#g-cit');if(gc&&(gc.classList.contains('v18-sim')||gc.classList.contains('v18-dim')))return;
    tb.innerHTML='';tb.classList.remove('v20-tools');tb.classList.add('v21-tools');
    const current=v21ToolCategory(citTool);if(!v21Category)v21Category=current?current.id:'buildings';

    const cats=document.createElement('div');cats.className='v21-category-col';
    V21_CATEGORIES.forEach(cat=>{
      const b=v21ToolButton(cat.icon,cat.label,!!(current&&current.id===cat.id));
      if(v21Category===cat.id)b.classList.add('category-open');
      b.addEventListener('click',()=>{v21Category=cat.id;v21RenderTools();});cats.appendChild(b);
    });
    const sep=document.createElement('div');sep.className='v21-edit-sep';cats.appendChild(sep);
    const broom=document.createElement('button');broom.className='v21-tool-btn v21-broom'+(citTool==='X'?' sel':'');broom.textContent='🧹';broom.title='Fjern';broom.setAttribute('aria-label','Fjern');broom.addEventListener('click',()=>v21SelectTool('X'));cats.appendChild(broom);
    const undo=document.createElement('button');undo.id='cit-undo';undo.className='v21-tool-btn v21-undo';undo.textContent='↶';undo.title='Angre';undo.setAttribute('aria-label','Angre');undo.disabled=!citUndo.length||citLock;
    undo.addEventListener('click',()=>{if(citLock||!citUndo.length)return;sfx('pop');const state=citUndo.pop();citRestore(state);if(S.cityArchivePending){S.cityArchivePending=false;save();}citResetHelp();});cats.appendChild(undo);

    const content=document.createElement('div');content.className='v21-content-col';
    const cat=V21_CATEGORIES.find(c=>c.id===v21Category)||V21_CATEGORIES[1];
    cat.items.forEach(([k,label],n)=>{
      const b=v21ToolButton(k,label,citTool===k,n,k==='S'?'🛍️':'');
      const price=Number(CITY_CFG.PRICE[k])||0;if(price){const p=document.createElement('span');p.className='v21-price';p.textContent=price;b.appendChild(p);}
      b.addEventListener('click',()=>v21SelectTool(k));content.appendChild(b);
    });
    tb.append(cats,content);
    requestAnimationFrame(()=>{if($('#g-cit')&&$('#g-cit').classList.contains('active')&&typeof citFitBoard==='function')citFitBoard();});
  }
  if(typeof citRenderTools==='function')citRenderTools=v21RenderTools;

  function v21DecorateTiles(){
    if(typeof cit==='undefined'||!cit||!Array.isArray(cit.g))return;
    const grid=$('#cit-grid');if(!grid)return;
    grid.querySelectorAll('.ct[data-i]').forEach(d=>{
      const i=Number(d.dataset.i),t=cit.g[i];if(!t)return;
      d.classList.add('v21-art','v21-type-'+t);
      d.querySelectorAll(':scope > .v21-tile-svg').forEach(x=>x.remove());
      if(t!=='H')d.querySelectorAll(':scope > .v20-tile-svg').forEach(x=>x.remove());
      if(['O','S','M','K','P','T','B','F','G','Q'].includes(t))d.appendChild(v21Svg(t,v21Variant(i,t),t==='S'?v21ShopEmoji(i):''));
    });
  }

  function v21UpgradeShared(el){
    if(!el)return;const type=el.dataset.v19Icon||V21_NEED_MAP[el.dataset.v19Original||el.textContent.trim()];if(!type)return;
    el.dataset.v19Icon=type;el.classList.add('v21-shared-icon');
    el.querySelectorAll(':scope > .v21-shared-svg').forEach(x=>x.remove());
    el.querySelectorAll(':scope > .v20-shared-svg').forEach(x=>x.remove());
    el.textContent='';el.appendChild(v21Svg(type,0,'','v21-shared-svg'));
  }
  function v21UpgradeSharedAll(root=document){root.querySelectorAll&&root.querySelectorAll('.v19-shared-icon,.v18-need-icon,.v18-stat-icon').forEach(v21UpgradeShared);}
  if(typeof citSetThought==='function'){
    const baseSetThought=citSetThought;citSetThought=function(el,icon){baseSetThought(el,icon);if(icon&&el){const g=el.querySelector('.cit-thought-icon');if(g)v21UpgradeShared(g);}};
  }

  function v21StopBus(){
    return svgEl('<path d="M17 27 Q18 20 27 20 H73 Q82 20 83 28 V67 Q83 74 76 74 H24 Q17 74 17 67Z"/>'+
      '<rect x="25" y="29" width="50" height="17" rx="3"/>'+
      '<rect x="25" y="52" width="50" height="8" rx="3"/>'+
      '<circle cx="30" cy="76" r="8"/><circle cx="70" cy="76" r="8"/>','v21-stop-bus');
  }
  function v21DecorateBusStops(){
    const grid=$('#cit-grid');if(!grid||typeof cit==='undefined'||!cit)return;
    grid.querySelectorAll('.cit-bus-stop').forEach(d=>{
      d.querySelectorAll(':scope > .v21-stop-frame').forEach(x=>x.remove());
      const id=Number(d.dataset.line);let color='';try{color=typeof citBusColor==='function'?citBusColor(id):'';}catch(e){}
      if(!color)color=getComputedStyle(d).getPropertyValue('--bus-color').trim()||'#267ac5';
      d.style.setProperty('--v21-line',color);
      const frame=document.createElement('span');frame.className='v21-stop-frame'+(d.classList.contains('v19-terminal')?' v21-terminal':'');
      const thick=Math.max(2,Math.round((Number(citTs)||16)*.11));frame.style.borderWidth=thick+'px';frame.appendChild(v21StopBus());d.appendChild(frame);
    });
  }

  if(typeof citRenderBusNetwork==='function'){
    const baseBus=citRenderBusNetwork;citRenderBusNetwork=function(){baseBus();v21DecorateBusStops();};
  }
  if(typeof citRenderTiles==='function'){
    const baseTiles=citRenderTiles;citRenderTiles=function(){baseTiles();v21DecorateTiles();v21DecorateBusStops();};
  }

  const city=$('#g-cit');if(city){
    const obs=new MutationObserver(muts=>{
      let tiles=false,shared=false,bus=false;
      for(const m of muts)for(const n of m.addedNodes||[]){
        if(n.nodeType!==1)continue;
        if(n.matches&&n.matches('.ct'))tiles=true;
        if(n.matches&&n.matches('.cit-bus-stop')||(n.querySelector&&n.querySelector('.cit-bus-stop')))bus=true;
        if(n.matches&&n.matches('.v19-shared-icon,.v18-need-icon,.v18-stat-icon')||(n.querySelector&&n.querySelector('.v19-shared-icon,.v18-need-icon,.v18-stat-icon')))shared=true;
      }
      if(tiles)v21DecorateTiles();if(bus)v21DecorateBusStops();if(shared)v21UpgradeSharedAll(city);
    });obs.observe(city,{childList:true,subtree:true});
  }

  v21DecorateTiles();v21DecorateBusStops();v21UpgradeSharedAll();
  if($('#g-cit')&&$('#g-cit').classList.contains('active'))v21RenderTools();
})();
