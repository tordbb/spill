(function(){
  'use strict';

  let queued=false;
  let wrapped=false;

  const q=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const city=()=>q('#g-cit');

  function make(tag,id,cls){
    let el=id&&q('#'+id);
    if(!el){el=document.createElement(tag);if(id)el.id=id;if(cls)el.className=cls;}
    return el;
  }

  function sourceBin(stage){
    let bin=q('#v31-source-bin');
    if(!bin){bin=make('div','v31-source-bin');stage.appendChild(bin);}
    return bin;
  }

  function prepareActionScroller(content){
    if(!content)return null;
    let inner=q(':scope > .v31-action-scroll-inner',content);
    if(!inner){
      inner=document.createElement('div');
      inner.className='v31-action-scroll-inner';
      const children=[...content.children];
      children.forEach(el=>inner.appendChild(el));
      content.appendChild(inner);
      content.dataset.v31Progress='0';
    }
    const max=Math.max(0,inner.scrollHeight-content.clientHeight);
    const progress=Math.max(0,Math.min(max,Number(content.dataset.v31Progress)||0));
    content.dataset.v31Progress=String(progress);
    inner.style.transform='translate3d(0,'+(-progress)+'px,0)';
    return {inner,max,progress};
  }

  function setActionProgress(content,value){
    const state=prepareActionScroller(content);
    if(!state)return 0;
    const next=Math.max(0,Math.min(state.max,Number(value)||0));
    content.dataset.v31Progress=String(next);
    state.inner.style.transform='translate3d(0,'+(-next)+'px,0)';
    return next;
  }

  function installActionScroller(content){
    if(!content)return;
    prepareActionScroller(content);
    if(content.dataset.v31PhysicalScroller==='1')return;
    content.dataset.v31PhysicalScroller='1';

    let drag=null;
    let suppressUntil=0;

    content.addEventListener('touchstart',e=>{
      const t=e.touches&&e.touches[0];if(!t)return;
      const state=prepareActionScroller(content);if(!state)return;
      const tapTarget=e.target&&e.target.closest?e.target.closest('.v23-tool-btn'):null;
      drag={
        x:t.clientX,
        y:t.clientY,
        progress:state.progress,
        tapTarget,
        moved:false
      };
      /* The entire city is rotated +90 degrees. A local upward translation maps
         to a physical rightward translation. Therefore physical finger dx maps
         directly to progress: +42px finger movement => +42px list movement. */
      e.preventDefault();
    },{passive:false});

    content.addEventListener('touchmove',e=>{
      if(!drag)return;
      const t=e.touches&&e.touches[0];if(!t)return;
      const dx=t.clientX-drag.x;
      const dy=t.clientY-drag.y;
      if(Math.abs(dx)<3&&Math.abs(dy)<3)return;
      if(Math.abs(dx)>=Math.abs(dy)){
        const before=Number(content.dataset.v31Progress)||0;
        const after=setActionProgress(content,drag.progress+dx);
        if(after!==before)drag.moved=true;
        e.preventDefault();
      }
    },{passive:false});

    const end=()=>{
      if(!drag)return;
      const {moved,tapTarget}=drag;
      drag=null;
      if(moved){
        suppressUntil=performance.now()+120;
      }else if(tapTarget&&tapTarget.isConnected){
        queueMicrotask(()=>tapTarget.click());
      }
    };
    content.addEventListener('touchend',end,{passive:true});
    content.addEventListener('touchcancel',end,{passive:true});

    content.addEventListener('click',e=>{
      if(performance.now()<suppressUntil){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },true);

    content.addEventListener('wheel',e=>{
      const delta=Math.abs(e.deltaX)>=Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      if(!delta)return;
      const before=Number(content.dataset.v31Progress)||0;
      const after=setActionProgress(content,before+delta);
      if(after!==before)e.preventDefault();
    },{passive:false});

    requestAnimationFrame(()=>prepareActionScroller(content));
  }

  function flattenTools(tools){
    const cats=q('.v23-category-col',tools),content=q('.v23-content-col',tools);
    if(!cats||!content)return;

    const fixed=q('#v30-fixed-actions',tools);
    const undo=(fixed&&q('#cit-undo',fixed))||q('#cit-undo',cats);
    const del=(fixed&&q('.v23-broom',fixed))||q('.v23-broom',cats);
    let sep=q('.v30-edit-sep',tools)||q('.v23-edit-sep',cats);
    if(!sep){sep=document.createElement('div');sep.className='v31-tool-sep';}
    sep.className='v31-tool-sep';

    const categories=qa(':scope > .v23-tool-btn',cats).filter(b=>b!==undo&&b!==del);
    cats.replaceChildren(...[undo,del,sep,...categories].filter(Boolean));
    if(fixed)fixed.remove();
    qa(':scope > .v30-edit-sep',tools).forEach(x=>x.remove());

    const inner=q(':scope > .v30-scroll-inner',content);
    if(inner){
      while(inner.firstChild)content.insertBefore(inner.firstChild,inner);
      inner.remove();
    }
    installActionScroller(content);
  }

  function updateHelpDisplay(){
    const source=q('#cit-help'),display=q('#v31-help-display');
    if(!source||!display)return;
    const main=q('#cit-help-main',source),tip=q('#cit-help-tip',source);
    const a=(main?.textContent||'').trim();
    const b=tip&&getComputedStyle(tip).display!=='none'?(tip.textContent||'').trim():'';
    display.textContent=[a,b].filter(Boolean).join(' · ');
    display.setAttribute('aria-label',display.textContent);
  }

  function ensureStructure(){
    const c=city(),stage=c&&q('.stage-wrap',c),viewport=q('#cit-viewport',c);
    const tools=q('#cit-tools',c),help=q('#cit-help',c);
    const exit=q('#v25-exit',c),menu=q('#v25-menu',c);
    const hud=q('#cit-hud',c),week=q('#cit-week',c),stats=q('#cit-pop-wrap',c),night=q('#cit-night',c);
    if(!c||!stage||!viewport||!tools||!help||!exit||!menu||!hud||!week||!stats||!night)return false;

    c.classList.add('v31-layout');

    const top=make('div','v31-top');
    const bottom=make('div','v31-bottom');
    const actions=make('section','v31-actions','v31-panel');
    const status=make('section','v31-status','v31-panel');
    const helpDisplay=make('div','v31-help-display');
    const bin=sourceBin(stage);

    flattenTools(tools);

    const topBar=q('.top-bar',c);
    const navSlot=q('#v25-nav-slot',c);
    if(topBar&&topBar.parentNode!==bin)bin.appendChild(topBar);
    if(help.parentNode!==bin)bin.appendChild(help);
    if(navSlot&&navSlot.parentNode!==bin)bin.appendChild(navSlot);

    if(menu.parentNode!==top)top.appendChild(menu);
    if(helpDisplay.parentNode!==top)top.appendChild(helpDisplay);
    if(exit.parentNode!==top)top.appendChild(exit);

    if(tools.parentNode!==actions)actions.appendChild(tools);

    const statsCell=make('div','v31-stats-cell','v31-status-cell');
    const moonCell=make('div','v31-moon-cell','v31-status-cell');
    const moneyCell=make('div','v31-money-cell','v31-status-cell');
    const dayCell=make('div','v31-day-cell','v31-status-cell');
    if(stats.parentNode!==statsCell)statsCell.appendChild(stats);
    if(night.parentNode!==moonCell)moonCell.appendChild(night);
    if(hud.parentNode!==moneyCell)moneyCell.appendChild(hud);
    if(week.parentNode!==dayCell)dayCell.appendChild(week);
    const statusOrder=[statsCell,moonCell,moneyCell,dayCell];
    if(status.children.length!==statusOrder.length||statusOrder.some((el,i)=>status.children[i]!==el)){
      status.replaceChildren(...statusOrder);
    }

    /* Internal top-to-bottom order maps to physical right-to-left after the city
       is rotated. Status above actions therefore becomes status-right/actions-left. */
    if(bottom.children.length!==2||bottom.children[0]!==status||bottom.children[1]!==actions){
      bottom.replaceChildren(status,actions);
    }

    const desired=[top,viewport,bottom,bin];
    if(stage.children.length!==desired.length||desired.some((el,i)=>stage.children[i]!==el)){
      stage.replaceChildren(...desired);
    }

    updateHelpDisplay();
    return true;
  }

  function num(v){const n=parseFloat(v);return Number.isFinite(n)?n:0;}

  function fitBoard(){
    if(!ensureStructure())return;
    const c=city(),stage=q('.stage-wrap',c),top=q('#v31-top',c),bottom=q('#v31-bottom',c);
    const v=q('#cit-viewport',c),g=q('#cit-grid',c);
    if(!stage||!top||!bottom||!v||!g||typeof CITY_CFG==='undefined')return;

    const cs=getComputedStyle(stage);
    const innerW=stage.clientWidth-num(cs.paddingLeft)-num(cs.paddingRight);
    const innerH=stage.clientHeight-num(cs.paddingTop)-num(cs.paddingBottom);
    const gap=num(cs.columnGap||cs.gap);
    const availW=Math.max(40,innerW-top.offsetWidth-bottom.offsetWidth-gap*2);
    const availH=Math.max(40,innerH);

    const oldW=v.clientWidth||0,oldH=v.clientHeight||0;
    let focusX=.5,focusY=.5;
    try{
      if(oldW&&oldH&&typeof citCam!=='undefined'){
        focusX=(oldW/2-citCam.x)/(citCam.scale||1)/oldW;
        focusY=(oldH/2-citCam.y)/(citCam.scale||1)/oldH;
      }
    }catch(_e){}

    /* The screen is rotated, so the local board height becomes the physical
       board width. Fill that physical width first; if the board becomes wider than
       the middle strip locally, the viewport crops it rather than shrinking the
       whole map into a narrow band. */
    const byPhysicalWidth=Math.floor(availH/CITY_CFG.ROWS);
    citTs=Math.max(4,byPhysicalWidth);
    const bw=CITY_CFG.COLS*citTs,bh=CITY_CFG.ROWS*citTs;
    const vw=Math.min(availW,bw);
    const vh=Math.min(availH,bh);
    v.style.width=vw+'px';v.style.height=vh+'px';
    g.style.width=bw+'px';g.style.height=bh+'px';
    g.style.backgroundSize=`${citTs}px ${citTs}px, ${citTs}px ${citTs}px, ${citTs}px ${citTs}px`;
    g.querySelectorAll('.ct[data-i]').forEach(d=>d.style.setProperty('--v23-ts',citTs+'px'));

    try{
      if(typeof citCam!=='undefined'){
        if(oldW&&oldH&&citCam.scale>1){
          citCam.x=vw/2-focusX*bw*citCam.scale;
          citCam.y=vh/2-focusY*bh*citCam.scale;
        }else{
          citCam.x=(vw-bw)/2;
          citCam.y=(vh-bh)/2;
        }
      }
      if(typeof citApplyCamera==='function')citApplyCamera();
    }catch(_e){}

    const topLen=Math.max(20,top.clientHeight-96);
    q('#v31-help-display')?.style.setProperty('--v31-help-length',topLen+'px');
  }

  function cleanRoadState(){
    const road=q('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category="0"]');
    if(!road)return;
    road.classList.add('v31-road-category');
    const icon=q('.v29-road-network,.v27-road-network',road);
    if(icon){
      icon.style.border='0';icon.style.outline='0';icon.style.boxShadow='none';icon.style.background='transparent';
    }
  }

  function wrapRuntime(){
    if(wrapped)return;wrapped=true;
    if(typeof citRenderTools==='function'&&!citRenderTools.__v31Wrapped){
      const base=citRenderTools;
      const fn=function(){const r=base.apply(this,arguments);queueMicrotask(queue);return r;};
      fn.__v31Wrapped=true;citRenderTools=fn;
    }
    if(typeof citRenderHelp==='function'&&!citRenderHelp.__v31Wrapped){
      const base=citRenderHelp;
      const fn=function(){const r=base.apply(this,arguments);queueMicrotask(()=>{updateHelpDisplay();queue();});return r;};
      fn.__v31Wrapped=true;citRenderHelp=fn;
    }
  }

  function scan(){
    queued=false;
    wrapRuntime();
    if(!ensureStructure())return;
    cleanRoadState();
    updateHelpDisplay();
    fitBoard();
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(scan);}

  wrapRuntime();
  if(typeof citFitBoard==='function')citFitBoard=fitBoard;
  const c=city();
  if(c){
    const obs=new MutationObserver(queue);
    obs.observe(c,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  }
  addEventListener('resize',queue,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(queue,80),{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',queue,{passive:true});
  queue();
})();