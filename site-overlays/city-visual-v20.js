(function(){
  'use strict';

  const V20_NEED_MAP={
    '🏠':'H','🏢':'O','🛍️':'S','🏪':'S','🏫':'K','🛖':'M','🚜':'M','🛣️':'R',
    '🌳':'P','🌲':'T','🎠':'G','⛲':'F','🪑':'B','💧':'W'
  };
  const V20_CATEGORIES=[
    {id:'transport',label:'Vei og buss',icon:'R',items:[['R','Vei'],['A','Sti'],['BUS','Buss']]},
    {id:'buildings',label:'Bygg',icon:'H',items:[['H','Hus'],['O','Kontor'],['S','Butikk'],['M','Gård'],['K','Skole']]},
    {id:'park',label:'Park',icon:'P',items:[['E','Gress'],['P','Løvtre'],['T','Bartre'],['B','Benk'],['G','Karusell'],['F','Fontene'],['W','Vann']]}
  ];
  const HOUSE_PALETTES=[
    ['#d75d58','#f2d2a0','#87573f','#f7e7c6'],
    ['#d88749','#f4e1b6','#865d43','#fff1d4'],
    ['#668fc0','#f0cfb7','#6d5548','#e6f1f7'],
    ['#b45f87','#f5d6c0','#785248','#f8e7d8'],
    ['#6e9f68','#f2d6a5','#775640','#ecf1d8']
  ];
  const SHOP_PALETTES=[
    ['#e75f6d','#fff1dc','#f5c65d'],
    ['#4f9bc7','#eaf4ed','#f1b960'],
    ['#7f72bd','#f2e9d7','#ef866a'],
    ['#4c9b6c','#f3e8c9','#e8b954'],
    ['#d7834e','#f6eedb','#5aa7b8'],
    ['#be5e8c','#f9e7d5','#70a3cf']
  ];
  let v20Category=null;

  function escText(s){return String(s==null?'':s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));}
  function svgEl(markup,cls='v20-svg'){
    const wrap=document.createElement('span');wrap.innerHTML='<svg class="'+cls+'" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'+markup+'</svg>';
    return wrap.firstElementChild;
  }
  function v20Markup(type,variant=0,shopEmoji=''){
    const v=Math.abs(Number(variant)||0);
    if(type==='H'){
      const [roof,wall,door,trim]=HOUSE_PALETTES[v%HOUSE_PALETTES.length];
      const shift=(v%3)-1;
      return '<ellipse cx="50" cy="87" rx="32" ry="6" fill="#27452f24"/>'+
        '<path d="M20 48 Q20 43 26 39 L45 '+(20+shift)+' Q51 15 57 20 L83 39 Q88 43 84 49 L80 53 V82 Q80 88 74 88 H26 Q20 88 20 82Z" fill="'+wall+'"/>'+
        '<path d="M14 48 Q18 40 26 35 L45 18 Q51 13 58 19 L87 40 Q90 44 85 48 L78 52 L52 29 L25 53Z" fill="'+roof+'"/>'+
        '<rect x="43" y="61" width="15" height="27" rx="4" fill="'+door+'"/>'+
        '<rect x="26" y="58" width="12" height="13" rx="4" fill="'+trim+'"/><rect x="63" y="55" width="12" height="13" rx="4" fill="'+trim+'"/>';
    }
    if(type==='O'){
      const bodies=['#6d9dbb','#788db9','#699e9b'];const body=bodies[v%bodies.length];
      return '<ellipse cx="51" cy="89" rx="30" ry="5" fill="#27452f26"/>'+
        '<path d="M27 19 Q28 12 35 12 H70 Q77 12 78 19 L82 82 Q82 88 75 88 H25 Q19 88 20 81Z" fill="'+body+'"/>'+
        '<path d="M28 20 Q48 12 76 19 L76 28 Q51 23 27 30Z" fill="#4f7188" opacity=".55"/>'+
        '<g fill="#dff3fb"><rect x="31" y="31" width="13" height="11" rx="3"/><rect x="55" y="29" width="13" height="11" rx="3"/><rect x="32" y="51" width="13" height="11" rx="3"/><rect x="57" y="49" width="13" height="11" rx="3"/></g>'+
        '<rect x="43" y="69" width="19" height="19" rx="5" fill="#435d6c"/>';
    }
    if(type==='K'){
      return '<ellipse cx="50" cy="88" rx="37" ry="5" fill="#27452f24"/>'+
        '<path d="M12 48 Q13 43 20 42 H81 Q88 42 88 49 V82 Q88 87 82 87 H18 Q12 87 12 81Z" fill="#ead8aa"/>'+
        '<path d="M9 47 L29 27 Q33 23 38 27 L50 37 L63 24 Q68 20 73 25 L91 45 Q94 49 88 51 L66 39 L51 48 L34 39 L16 52Z" fill="#c95c52"/>'+
        '<rect x="43" y="56" width="17" height="31" rx="5" fill="#6588a0"/><rect x="21" y="59" width="13" height="12" rx="4" fill="#eaf4f5"/><rect x="67" y="58" width="13" height="12" rx="4" fill="#eaf4f5"/>'+
        '<path d="M50 35 V16" stroke="#5f584b" stroke-width="4" stroke-linecap="round"/><path d="M52 17 Q64 18 69 24 Q62 29 52 27Z" fill="#f2c84b"/>';
    }
    if(type==='M'){
      return '<ellipse cx="51" cy="89" rx="36" ry="5" fill="#27452f25"/>'+
        '<path d="M12 72 Q28 57 45 67 Q64 76 89 63 L89 88 H12Z" fill="#8fbf68"/>'+
        '<path d="M21 48 Q21 43 27 42 H75 Q81 42 81 49 V84 H21Z" fill="#cf674f"/>'+
        '<path d="M15 49 L45 19 Q51 14 57 20 L87 49 Q89 52 84 54 L52 31 L20 55Z" fill="#7d4439"/>'+
        '<path d="M41 58 H62 V84 H41Z" fill="#f0d5a0"/><path d="M42 59 L61 83 M61 59 L42 83" stroke="#9b674b" stroke-width="4"/>'+
        '<path d="M18 77 q8 -12 15 0 M72 72 q8 -12 15 0" stroke="#e4c24f" stroke-width="5" fill="none" stroke-linecap="round"/>';
    }
    if(type==='S'){
      const [awning,wall,accent]=SHOP_PALETTES[v%SHOP_PALETTES.length];const sign=escText(shopEmoji||'•');
      return '<ellipse cx="50" cy="89" rx="35" ry="5" fill="#27452f24"/>'+
        '<path d="M15 43 Q16 36 24 35 H77 Q85 35 86 43 L84 83 Q84 88 78 88 H21 Q15 88 15 82Z" fill="'+wall+'"/>'+
        '<path d="M11 44 Q13 32 23 31 H80 Q89 32 90 44 L85 53 Q78 58 71 51 Q64 58 57 51 Q50 59 43 51 Q36 58 29 51 Q22 58 15 52Z" fill="'+awning+'"/>'+
        '<rect x="24" y="59" width="31" height="22" rx="6" fill="#bfe1e7"/><rect x="62" y="61" width="14" height="27" rx="5" fill="'+accent+'"/>'+
        '<path d="M31 30 Q49 18 69 30" stroke="'+accent+'" stroke-width="8" stroke-linecap="round"/>'+
        '<text x="50" y="31" text-anchor="middle" dominant-baseline="middle" font-size="21">'+sign+'</text>';
    }
    if(type==='P'){
      const greens=[['#4e9a54','#73b964'],['#438d57','#67ad62'],['#5a9f48','#80bd62']][v%3];
      return '<ellipse cx="51" cy="88" rx="23" ry="5" fill="#27452f25"/><path d="M48 56 Q51 48 55 57 L59 88 H43Z" fill="#79553a"/>'+
        '<path d="M18 48 Q15 34 28 28 Q31 13 48 18 Q61 7 70 21 Q87 22 84 38 Q94 50 80 59 Q73 73 59 66 Q45 78 36 65 Q20 66 18 48Z" fill="'+greens[0]+'"/>'+
        '<path d="M30 37 Q40 22 55 27 M58 20 Q72 29 72 42" stroke="'+greens[1]+'" stroke-width="8" stroke-linecap="round" fill="none" opacity=".75"/>';
    }
    if(type==='T'){
      return '<ellipse cx="50" cy="89" rx="19" ry="4" fill="#27452f25"/><rect x="45" y="66" width="11" height="23" rx="3" fill="#72513b"/>'+
        '<path d="M50 9 L80 52 H67 L86 76 H14 L33 52 H20Z" fill="#3e8757"/><path d="M50 19 L68 48 H58 L73 67 H28 L43 48 H34Z" fill="#5ca06b" opacity=".72"/>';
    }
    if(type==='B') return '<ellipse cx="51" cy="84" rx="34" ry="5" fill="#27452f20"/><path d="M17 44 Q18 38 25 39 H78 Q84 39 84 45 V55 H17Z" fill="#a96d42"/><path d="M20 59 H82 V70 H20Z" fill="#bb7a49"/><path d="M28 68 V86 M73 68 V86" stroke="#70462f" stroke-width="8" stroke-linecap="round"/>';
    if(type==='F') return '<ellipse cx="50" cy="80" rx="38" ry="12" fill="#b9d9dd"/><ellipse cx="50" cy="73" rx="31" ry="12" fill="#66b7d3"/><ellipse cx="50" cy="70" rx="18" ry="7" fill="#d9eef0"/><path d="M50 61 Q37 43 48 22 Q58 42 50 61 M50 61 Q65 48 71 33" stroke="#e8fbff" stroke-width="7" fill="none" stroke-linecap="round"/>';
    if(type==='G') return '<ellipse cx="50" cy="84" rx="34" ry="8" fill="#27452f22"/><path d="M23 45 Q50 10 79 45Z" fill="#e56c73"/><path d="M25 45 Q50 20 50 13 Q51 20 77 45" stroke="#f4d367" stroke-width="12" fill="none"/><rect x="47" y="43" width="7" height="39" rx="3" fill="#fff0cf"/><path d="M20 78 Q50 69 82 78" stroke="#5ca6b7" stroke-width="9" stroke-linecap="round"/>';
    if(type==='R') return '<rect x="7" y="31" width="86" height="38" rx="8" fill="#687174"/><path d="M20 50 H80" stroke="#f2edce" stroke-width="6" stroke-linecap="round" stroke-dasharray="13 11"/>';
    if(type==='A') return '<path d="M7 56 Q25 33 43 48 Q62 65 93 42" stroke="#cdb587" stroke-width="31" fill="none" stroke-linecap="round"/><path d="M7 56 Q25 33 43 48 Q62 65 93 42" stroke="#e1cda5" stroke-width="4" fill="none" stroke-dasharray="3 8"/>';
    if(type==='E') return '<path d="M12 78 Q26 58 39 75 Q52 51 65 72 Q78 54 90 74 V91 H12Z" fill="#77b85e"/>';
    if(type==='W') return '<rect x="7" y="15" width="86" height="71" rx="18" fill="#55acd0"/><path d="M15 38 Q30 29 45 38 T76 38 T95 38 M7 60 Q24 50 41 60 T75 60 T96 60" stroke="#99dced" stroke-width="6" fill="none" stroke-linecap="round"/>';
    if(type==='BUS') return '<path d="M14 31 Q15 23 24 22 H77 Q87 22 88 32 V69 Q88 77 79 77 H22 Q13 77 13 68Z" fill="#4e9dd6"/><rect x="24" y="31" width="22" height="17" rx="4" fill="#e8f7fb"/><rect x="55" y="31" width="22" height="17" rx="4" fill="#e8f7fb"/><circle cx="28" cy="78" r="8" fill="#334a56"/><circle cx="73" cy="78" r="8" fill="#334a56"/>';
    return '';
  }
  function v20Svg(type,variant=0,shopEmoji='',cls='v20-svg'){return svgEl(v20Markup(type,variant,shopEmoji),cls);}

  function v20ShopEmoji(i){
    try{
      const arr=CITY_CFG&&Array.isArray(CITY_CFG.SHOP_TYPES)?CITY_CFG.SHOP_TYPES:[];
      return arr.length?arr[(Number(cit.st&&cit.st[i])||0)%arr.length]:'';
    }catch(e){return '';}
  }
  function v20Variant(i,type){
    if(type==='S')return Number(cit.st&&cit.st[i])||0;
    return (Number(i)||0)*7+(type?type.charCodeAt(0):0);
  }

  function v20DecorateTiles(){
    if(typeof cit==='undefined'||!cit||!Array.isArray(cit.g))return;
    const grid=$('#cit-grid');if(!grid)return;
    grid.querySelectorAll('.ct[data-i]').forEach(d=>{
      const i=Number(d.dataset.i),t=cit.g[i];if(!t)return;
      d.classList.add('v20-art','v20-type-'+t);
      d.querySelectorAll(':scope > .v20-tile-svg').forEach(x=>x.remove());
      if(['H','O','S','M','K','P','T','B','F','G','Q'].includes(t)){
        const svg=v20Svg(t==='Q'?'E':t,v20Variant(i,t),t==='S'?v20ShopEmoji(i):'','v20-tile-svg');
        if(t==='Q')svg.classList.add('v20-farm-plot-art');
        d.appendChild(svg);
      }
    });
  }

  function v20ToolCategory(tool){return V20_CATEGORIES.find(c=>c.items.some(x=>x[0]===tool))||null;}
  function v20ToolButton(type,label,selected=false){
    const b=document.createElement('button');b.className='v20-tool-btn'+(selected?' sel':'');
    b.appendChild(v20Svg(type,0,'','v20-tool-svg'));b.title=label;b.setAttribute('aria-label',label);return b;
  }
  function v20SelectTool(k){
    if(k==='BUS'&&citLock)return;
    sfx('click');citTool=k;v20Category=null;
    if(k==='BUS')citBusSelectedLine=null;else citBusMessage='';
    citRenderTools();citRenderHelp();citRenderBusNetwork();
  }
  function v20RenderTools(){
    const tb=$('#cit-tools');if(!tb)return;
    const gc=$('#g-cit');if(gc&&(gc.classList.contains('v18-sim')||gc.classList.contains('v18-dim')))return;
    tb.innerHTML='';tb.classList.add('v20-tools');

    const broom=document.createElement('button');broom.className='v20-tool-btn v20-broom'+(citTool==='X'?' sel':'');broom.textContent='🧹';broom.title='Fjern';broom.setAttribute('aria-label','Fjern');
    broom.addEventListener('click',()=>v20SelectTool('X'));tb.appendChild(broom);
    const undo=document.createElement('button');undo.id='cit-undo';undo.className='v20-tool-btn v20-undo';undo.textContent='↶';undo.title='Angre';undo.setAttribute('aria-label','Angre');undo.disabled=!citUndo.length||citLock;
    undo.addEventListener('click',()=>{if(citLock||!citUndo.length)return;sfx('pop');const state=citUndo.pop();citRestore(state);if(S.cityArchivePending){S.cityArchivePending=false;save();}citResetHelp();});tb.appendChild(undo);
    const sep=document.createElement('span');sep.className='v20-tool-sep';tb.appendChild(sep);

    const current=v20ToolCategory(citTool);
    if(v20Category){
      const cat=V20_CATEGORIES.find(c=>c.id===v20Category);
      if(cat){
        const head=v20ToolButton(cat.icon,cat.label,true);head.classList.add('v20-category-head');
        head.addEventListener('click',()=>{v20Category=null;v20RenderTools();});tb.appendChild(head);
        cat.items.forEach(([k,label])=>{
          const b=v20ToolButton(k,label,citTool===k);b.classList.add('v20-item-btn');
          const price=Number(CITY_CFG.PRICE[k])||0;if(price){const p=document.createElement('span');p.className='v20-price';p.textContent=price;b.appendChild(p);}
          b.addEventListener('click',()=>v20SelectTool(k));tb.appendChild(b);
        });
      }
    }else{
      V20_CATEGORIES.forEach(cat=>{
        const b=v20ToolButton(cat.icon,cat.label,!!(current&&current.id===cat.id));b.classList.add('v20-category-btn');
        b.addEventListener('click',()=>{v20Category=cat.id;v20RenderTools();});tb.appendChild(b);
      });
    }
    requestAnimationFrame(()=>{if($('#g-cit')&&$('#g-cit').classList.contains('active')&&typeof citFitBoard==='function')citFitBoard();});
  }
  if(typeof citRenderTools==='function')citRenderTools=v20RenderTools;

  function v20UpgradeShared(el){
    if(!el)return;
    const type=el.dataset.v19Icon||V20_NEED_MAP[el.dataset.v19Original||el.textContent.trim()];if(!type)return;
    el.classList.add('v20-shared-icon');el.textContent='';
    if(!el.querySelector('.v20-shared-svg'))el.appendChild(v20Svg(type,0,'','v20-shared-svg'));
  }
  function v20UpgradeSharedAll(root=document){
    root.querySelectorAll&&root.querySelectorAll('.v19-shared-icon,.v18-need-icon,.v18-stat-icon').forEach(el=>{
      if(!el.dataset.v19Icon){const raw=el.dataset.v19Original||el.textContent.trim(),t=V20_NEED_MAP[raw];if(t)el.dataset.v19Icon=t;}
      v20UpgradeShared(el);
    });
  }
  if(typeof citSetThought==='function'){
    const baseThought=citSetThought;
    citSetThought=function(el,icon){baseThought(el,icon);if(icon&&el){const glyph=el.querySelector('.cit-thought-icon');if(glyph){if(!glyph.dataset.v19Icon&&V20_NEED_MAP[icon])glyph.dataset.v19Icon=V20_NEED_MAP[icon];v20UpgradeShared(glyph);}}};
  }

  if(typeof citRenderTiles==='function'){
    const baseTiles=citRenderTiles;
    citRenderTiles=function(){baseTiles();v20DecorateTiles();v20UpgradeSharedAll($('#g-cit')||document);};
  }

  const city=$('#g-cit');if(city){
    const obs=new MutationObserver(muts=>{
      let shared=false,tiles=false;
      for(const m of muts)for(const n of m.addedNodes||[]){if(n.nodeType!==1)continue;if(n.matches&&n.matches('.ct'))tiles=true;if(n.matches&&n.matches('.v19-shared-icon,.v18-need-icon,.v18-stat-icon')||(n.querySelector&&n.querySelector('.v19-shared-icon,.v18-need-icon,.v18-stat-icon')))shared=true;}
      if(tiles)v20DecorateTiles();if(shared)v20UpgradeSharedAll(city);
    });obs.observe(city,{childList:true,subtree:true});
  }

  v20DecorateTiles();v20UpgradeSharedAll();
  if($('#g-cit')&&$('#g-cit').classList.contains('active'))v20RenderTools();
})();
