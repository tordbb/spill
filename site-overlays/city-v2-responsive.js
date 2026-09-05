(function(){
  'use strict';

  let queued=false;
  let wrapped=false;
  let touchState=null;
  let suppressClickUntil=0;

  const q=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const city=()=>q('#g-cit');

  function make(tag,id,cls){
    let el=id?q('#'+id):null;
    if(!el){el=document.createElement(tag);if(id)el.id=id;if(cls)el.className=cls;}
    return el;
  }

  function viewportSize(){
    const vv=window.visualViewport;
    return {
      width:Math.max(1,Math.round(vv&&vv.width?vv.width:innerWidth)),
      height:Math.max(1,Math.round(vv&&vv.height?vv.height:innerHeight))
    };
  }

  function syncViewportVars(){
    const c=city();if(!c)return null;
    const size=viewportSize();
    c.style.setProperty('--v2-vw',size.width+'px');
    c.style.setProperty('--v2-vh',size.height+'px');
    const portrait=size.height>size.width;
    c.classList.add('v2-city-layout');
    c.classList.toggle('v2-portrait',portrait);
    c.classList.toggle('v2-landscape',!portrait);
    c.dataset.v2Orientation=portrait?'portrait':'landscape';
    return {portrait,...size};
  }

  function label(el){
    return [el?.textContent,el?.id,typeof el?.className==='string'?el.className:'',el?.getAttribute?.('aria-label'),el?.title]
      .filter(Boolean).join(' ').toLowerCase();
  }

  function findHome(c){
    return q('.top-bar .nav-home',c)||q('.nav-home',c)||qa('button,[role="button"]',c).find(el=>(el.textContent||'').includes('🏡')||/\b(home|hjem)\b/.test(label(el)))||null;
  }

  function findSettings(c,home){
    const top=q('.top-bar',c);
    const pool=qa('button,[role="button"]',top||c).filter(el=>el!==home&&el.id!=='cit-clear');
    return pool.find(el=>(el.textContent||'').includes('⚙'))||pool.find(el=>/(settings?|innstill|gear|cog)/.test(label(el)))||null;
  }

  function ensureScaffold(){
    const c=city();if(!c)return null;
    const stage=q('.stage-wrap',c),viewport=q('#cit-viewport',c),tools=q('#cit-tools',c),right=q('#cit-right',c),help=q('#cit-help',c);
    if(!stage||!viewport||!tools||!right)return null;

    const source=make('div','v2-source-bin');
    if(source.parentNode!==c)c.appendChild(source);

    const side=make('aside','v2-side');
    const nav=make('div','v2-nav');
    const toolZone=make('div','v2-tool-zone');
    const toolScroll=make('div','v2-tool-scroll');
    const quick=make('div','v2-quick-actions');
    const statusNav=make('div','v2-status-nav');

    if(nav.parentNode!==side)side.appendChild(nav);
    if(toolZone.parentNode!==side)side.appendChild(toolZone);
    if(toolScroll.parentNode!==toolZone)toolZone.appendChild(toolScroll);
    if(quick.parentNode!==toolZone)toolZone.appendChild(quick);
    if(tools.parentNode!==toolScroll)toolScroll.appendChild(tools);

    const top=q('.top-bar',c);
    const home=findHome(c);
    const settings=findSettings(c,home);
    if(top&&top.parentNode!==source)source.appendChild(top);

    if(help&&help.parentNode!==stage)stage.appendChild(help);
    if(side.parentNode!==stage)stage.appendChild(side);
    if(viewport.parentNode!==stage)stage.appendChild(viewport);
    if(right.parentNode!==stage)stage.appendChild(right);

    return {c,stage,viewport,tools,right,help,source,side,nav,toolZone,toolScroll,quick,statusNav,home,settings};
  }

  function movePortrait(ui){
    const {right,statusNav,home,settings,nav,quick}=ui;
    if(statusNav.parentNode!==right)right.insertBefore(statusNav,right.firstChild);
    [home,settings].filter(Boolean).forEach(el=>{if(el.parentNode!==statusNav)statusNav.appendChild(el);});
    if(nav.childNodes.length===0)nav.textContent='';

    const night=q('#cit-night',ui.c),edit=q('#cit-edit-actions',ui.c);
    if(edit&&edit.parentNode!==quick)quick.appendChild(edit);
    if(night&&night.parentNode!==quick)quick.appendChild(night);

    const hud=q('#cit-hud',ui.c),stats=q('#cit-pop-wrap',ui.c),week=q('#cit-week',ui.c);
    [hud,stats,week].filter(Boolean).forEach(el=>{if(el.parentNode!==right)right.appendChild(el);});

    // Keep navigation first, then information. Any remaining status widgets stay after these.
    const ordered=[statusNav,hud,stats,week].filter(Boolean);
    ordered.forEach((el,i)=>{
      const ref=right.children[i];
      if(ref!==el)right.insertBefore(el,ref||null);
    });
  }

  function moveLandscape(ui){
    const {right,statusNav,home,settings,nav,quick}=ui;
    [home,settings].filter(Boolean).forEach(el=>{if(el.parentNode!==nav)nav.appendChild(el);});
    if(statusNav.parentNode===right)statusNav.remove();

    const edit=q('#cit-edit-actions',ui.c),night=q('#cit-night',ui.c);
    [edit,night].filter(Boolean).forEach(el=>{if(el.parentNode!==right)right.appendChild(el);});
    if(quick.childNodes.length===0)quick.textContent='';
  }

  function installPhysicalToolScroll(tools){
    if(!tools||tools.dataset.v2PhysicalScroll==='1')return;
    tools.dataset.v2PhysicalScroll='1';

    tools.addEventListener('touchstart',e=>{
      const c=city();if(!c?.classList.contains('v2-portrait'))return;
      const t=e.touches&&e.touches[0];if(!t)return;
      touchState={x:t.clientX,y:t.clientY,scrollTop:tools.scrollTop,moved:false};
    },{passive:true});

    tools.addEventListener('touchmove',e=>{
      if(!touchState||!city()?.classList.contains('v2-portrait'))return;
      const t=e.touches&&e.touches[0];if(!t)return;
      const dx=t.clientX-touchState.x,dy=t.clientY-touchState.y;
      if(Math.abs(dx)<3&&Math.abs(dy)<3)return;
      if(Math.abs(dx)>=Math.abs(dy)){
        tools.scrollTop=touchState.scrollTop-dx;
        touchState.moved=true;
        e.preventDefault();
      }
    },{passive:false});

    const end=()=>{
      if(touchState?.moved)suppressClickUntil=performance.now()+120;
      touchState=null;
    };
    tools.addEventListener('touchend',end,{passive:true});
    tools.addEventListener('touchcancel',end,{passive:true});
    tools.addEventListener('click',e=>{
      if(performance.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}
    },true);
    tools.addEventListener('wheel',e=>{
      if(!city()?.classList.contains('v2-portrait'))return;
      const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      if(!delta)return;
      const before=tools.scrollTop;
      tools.scrollTop+=delta;
      if(tools.scrollTop!==before)e.preventDefault();
    },{passive:false});
  }

  function fit(){
    const c=city();if(!c||!c.classList.contains('active'))return;
    try{if(typeof citFitBoard==='function')citFitBoard();}catch(_e){}
  }

  function applyLayout(){
    queued=false;
    const mode=syncViewportVars();
    const ui=ensureScaffold();
    if(!mode||!ui)return;
    installPhysicalToolScroll(ui.tools);
    if(mode.portrait)movePortrait(ui);else moveLandscape(ui);
    requestAnimationFrame(fit);
  }

  function queue(){if(queued)return;queued=true;requestAnimationFrame(applyLayout);}

  function wrapRenderers(){
    if(wrapped)return;wrapped=true;
    if(typeof citRenderTools==='function'&&!citRenderTools.__v2Wrapped){
      const base=citRenderTools;
      const fn=function(){const r=base.apply(this,arguments);queueMicrotask(queue);return r;};
      fn.__v2Wrapped=true;citRenderTools=fn;
    }
    if(typeof citHud==='function'&&!citHud.__v2Wrapped){
      const base=citHud;
      const fn=function(){const r=base.apply(this,arguments);queueMicrotask(queue);return r;};
      fn.__v2Wrapped=true;citHud=fn;
    }
  }

  wrapRenderers();
  const c=city();
  if(c){
    const obs=new MutationObserver(queue);
    obs.observe(c,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  addEventListener('resize',queue,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(queue,60),{passive:true});
  if(window.visualViewport){
    visualViewport.addEventListener('resize',queue,{passive:true});
    visualViewport.addEventListener('scroll',queue,{passive:true});
  }
  queue();
})();
