(function(){
  'use strict';

  let scanQueued=false;
  let runtimeWrapped=false;

  function q(sel,root=document){return root&&root.querySelector?root.querySelector(sel):null;}
  function qa(sel,root=document){return root&&root.querySelectorAll?[...root.querySelectorAll(sel)]:[];}
  function city(){return q('#g-cit');}

  function installQuietButtonClicks(){
    try{
      if(typeof sfx==='function'&&!sfx.__v29QuietClicks){
        const base=sfx;
        const wrapped=function(name){
          if(name==='click')return;
          return base.apply(this,arguments);
        };
        wrapped.__v29QuietClicks=true;
        wrapped.__v29Base=base;
        sfx=wrapped;
        try{window.sfx=wrapped;}catch(e){}
      }
    }catch(e){}
  }

  function restoreGameExitButtons(){
    const c=city();
    qa('.nav-home').forEach(btn=>{
      if(!c||!c.contains(btn)){
        btn.classList.remove('v25-nav-source','v25-anchor-source');
        delete btn.dataset.v25NavSource;
        ['left','top','width','height','min-width','min-height','margin','padding','opacity','pointer-events','overflow','z-index']
          .forEach(p=>btn.style.removeProperty(p));
      }
      btn.textContent='←';
      btn.setAttribute('aria-label','Tilbake');
      btn.title='Tilbake';
    });
  }

  function svg(markup,cls){
    const wrap=document.createElement('span');
    wrap.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" class="'+cls+'">'+markup+'</svg>';
    return wrap.firstElementChild;
  }
  function roadIcon(){
    return svg(
      '<path d="M13 24 H68 Q79 24 79 35 V80" fill="none" stroke="#505a5d" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M20 78 H52 Q63 78 63 67 V50 Q63 39 52 39 H34 Q23 39 23 50 V61" fill="none" stroke="#687275" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M13 24 H68 Q79 24 79 35 V80 M20 78 H52 Q63 78 63 67 V50 Q63 39 52 39 H34 Q23 39 23 50 V61" fill="none" stroke="#fff0b8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 8"/>'+
      '<circle cx="23" cy="39" r="5" fill="#344145"/><circle cx="63" cy="39" r="5" fill="#344145"/><circle cx="63" cy="78" r="5" fill="#344145"/>',
      'v29-category-svg v29-road-network');
  }
  function roofIcon(){
    return svg(
      '<path d="M8 72 L50 27 L92 72" fill="#d8534f" stroke="#7b3532" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M67 40 V17 H79 V54" fill="#b96549" stroke="#7b3532" stroke-width="5" stroke-linejoin="round"/>',
      'v29-category-svg v29-roof');
  }
  function parkIcon(){
    return svg(
      '<path d="M7 82 Q50 69 93 82 V94 H7Z" fill="#62a953"/>'+
      '<path d="M27 79 V58 M51 79 V48 M76 79 V60" stroke="#765035" stroke-width="7" stroke-linecap="round"/>'+
      '<circle cx="27" cy="48" r="18" fill="#4f9d54" stroke="#36763c" stroke-width="4"/>'+
      '<circle cx="51" cy="35" r="22" fill="#5cac55" stroke="#36763c" stroke-width="4"/>'+
      '<circle cx="76" cy="50" r="17" fill="#438d4c" stroke="#326f39" stroke-width="4"/>',
      'v29-category-svg v29-park');
  }
  const categoryIcons=[
    {cls:'v29-road-network',make:roadIcon},
    {cls:'v29-roof',make:roofIcon},
    {cls:'v29-park',make:parkIcon}
  ];

  function arrangeFixedActions(){
    const tools=q('#cit-tools');
    const cats=q('.v23-category-col',tools);
    const content=q('.v23-content-col',tools);
    if(!tools||!cats||!content)return;

    const broom=q(':scope > .v23-broom,[aria-label="Fjern"]',cats)||q('#v30-fixed-actions .v23-broom',tools);
    const undo=q(':scope > #cit-undo',cats)||q('#v30-fixed-actions #cit-undo',tools);
    const categories=qa(':scope > .v23-tool-btn',cats).filter(btn=>btn!==broom&&btn!==undo);

    let fixed=q('#v30-fixed-actions',tools);
    if(!fixed){fixed=document.createElement('div');fixed.id='v30-fixed-actions';}
    if(undo){undo.dataset.v30FixedAction='undo';fixed.appendChild(undo);}
    if(broom){broom.dataset.v30FixedAction='remove';fixed.appendChild(broom);}

    qa(':scope > .v23-edit-sep',cats).forEach(el=>el.remove());
    let sep=q(':scope > .v30-edit-sep',tools);
    if(!sep){sep=document.createElement('div');sep.className='v30-edit-sep';sep.setAttribute('aria-hidden','true');}

    cats.replaceChildren(...categories);
    tools.replaceChildren(fixed,sep,cats,content);
  }

  function fitAdaptiveRail(){
    const c=city(),rail=q('#v23-rail',c),info=q('#v23-info',c),tools=q('#cit-tools',c),help=q('#cit-help',c);
    if(!c||!rail||!info||!tools||!help)return;

    /* Tight mode already places info and tools side-by-side; only the normal stacked
       rail needs vertical arbitration when the live-needs text grows. */
    if(c.classList.contains('v23-tight')){
      help.style.removeProperty('max-height');
      help.style.removeProperty('overflow-y');
      tools.style.removeProperty('height');
      tools.style.removeProperty('max-height');
      return;
    }

    const rs=getComputedStyle(rail);
    const gap=parseFloat(rs.rowGap||rs.gap)||0;
    const fixed=q('#v30-fixed-actions',tools);
    const cats=q('.v23-category-col',tools);
    const sep=q('.v30-edit-sep',tools);
    const ts=getComputedStyle(tools);
    const toolChrome=(parseFloat(ts.paddingTop)||0)+(parseFloat(ts.paddingBottom)||0)+(parseFloat(ts.borderTopWidth)||0)+(parseFloat(ts.borderBottomWidth)||0);
    const fixedMin=Math.ceil(
      (fixed?fixed.getBoundingClientRect().height:0)+
      (sep?sep.getBoundingClientRect().height:0)+
      (cats?cats.scrollHeight:0)+
      toolChrome+10
    );

    const railH=rail.clientHeight;
    if(!railH||!fixedMin)return;

    /* Reserve enough room for all non-scrolling controls. If information grows,
       only the instruction region is allowed to contract/scroll. */
    const infoChildren=[...info.children];
    let nonHelp=0;
    for(const el of infoChildren){
      if(el===help)continue;
      const r=el.getBoundingClientRect();
      const cs=getComputedStyle(el);
      nonHelp+=r.height+(parseFloat(cs.marginTop)||0)+(parseFloat(cs.marginBottom)||0);
    }
    const is=getComputedStyle(info);
    const infoGap=parseFloat(is.rowGap||is.gap)||0;
    if(infoChildren.length>1)nonHelp+=infoGap*(infoChildren.length-1);

    const maxHelp=Math.max(22,Math.floor(railH-fixedMin-gap-nonHelp-4));
    help.style.maxHeight=maxHelp+'px';
    help.style.overflowY='auto';

    requestAnimationFrame(()=>{
      const available=Math.max(fixedMin,Math.floor(railH-info.getBoundingClientRect().height-gap));
      tools.style.height=Math.min(railH,available)+'px';
      tools.style.maxHeight=Math.min(railH,available)+'px';
    });
  }

  function installCategoryScroller(){
    const content=q('#cit-tools .v23-content-col');
    if(!content||content.dataset.v30Scroller==='1')return;
    content.dataset.v30Scroller='1';

    let drag=null;
    let touchDrag=null;
    let suppressClickUntil=0;

    const begin=(e)=>{
      if(e.pointerType==='touch')return;
      if(e.pointerType==='mouse'&&e.button!==0)return;
      drag={
        id:e.pointerId,
        x:e.clientX,
        y:e.clientY,
        scrollTop:content.scrollTop,
        moved:false
      };
      try{content.setPointerCapture(e.pointerId);}catch(_e){}
    };

    const move=(e)=>{
      if(!drag||e.pointerId!==drag.id)return;
      const dx=e.clientX-drag.x;
      const dy=e.clientY-drag.y;
      const delta=Math.abs(dx)>=Math.abs(dy)?dx:dy;
      if(Math.abs(delta)<3)return;
      drag.moved=true;
      content.scrollTop=drag.scrollTop-delta;
      e.preventDefault();
    };

    const end=(e)=>{
      if(!drag||e.pointerId!==drag.id)return;
      if(drag.moved)suppressClickUntil=performance.now()+220;
      try{content.releasePointerCapture(e.pointerId);}catch(_e){}
      drag=null;
    };

    content.addEventListener('pointerdown',begin,{passive:true});
    content.addEventListener('pointermove',move,{passive:false});
    content.addEventListener('pointerup',end,{passive:true});
    content.addEventListener('pointercancel',end,{passive:true});

    content.addEventListener('touchstart',e=>{
      const t=e.touches&&e.touches[0];if(!t)return;
      touchDrag={x:t.clientX,y:t.clientY,scrollTop:content.scrollTop,moved:false};
    },{passive:true});
    content.addEventListener('touchmove',e=>{
      if(!touchDrag)return;
      const t=e.touches&&e.touches[0];if(!t)return;
      const dx=t.clientX-touchDrag.x;
      const dy=t.clientY-touchDrag.y;
      const delta=Math.abs(dx)>=Math.abs(dy)?dx:dy;
      if(Math.abs(delta)<3)return;
      touchDrag.moved=true;
      content.scrollTop=touchDrag.scrollTop-delta;
      e.preventDefault();
    },{passive:false});
    const endTouch=()=>{
      if(touchDrag&&touchDrag.moved)suppressClickUntil=performance.now()+220;
      touchDrag=null;
    };
    content.addEventListener('touchend',endTouch,{passive:true});
    content.addEventListener('touchcancel',endTouch,{passive:true});
    content.addEventListener('click',e=>{
      if(performance.now()<suppressClickUntil){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },true);
    content.addEventListener('wheel',e=>{
      if(content.scrollHeight<=content.clientHeight)return;
      const delta=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;
      if(!delta)return;
      content.scrollTop+=delta;
      e.preventDefault();
    },{passive:false});
  }

  function enforceCategoryIcons(){
    const buttons=qa('#cit-tools .v23-category-col > .v23-tool-btn')
      .filter(btn=>!btn.classList.contains('v23-broom')&&btn.id!=='cit-undo');
    buttons.forEach((btn,i)=>{btn.dataset.v29Category=String(i);});
    buttons.slice(0,3).forEach((btn,i)=>{
      const spec=categoryIcons[i];if(!spec)return;
      let keep=q(':scope > .'+spec.cls,btn);
      qa(':scope > .v26-category-svg,:scope > .v23-tool-icon,:scope > .v19-tool-glyph,:scope > .v27-road-network,:scope > .v28-category-svg,:scope > .v29-category-svg',btn)
        .forEach(el=>{if(el!==keep)el.remove();});
      if(!keep){keep=spec.make();btn.prepend(keep);}
    });
  }

  function decorateMoonCue(){
    const main=q('#cit-help-main'),night=q('#cit-night');
    if(!main||!night)return;
    const exact='Bygg, trykk 🌙, og byen får en ny dag';
    const existing=q('#v29-moon-cue',main);
    if(!existing&&main.textContent.trim()!==exact)return;
    let cue=existing;
    if(!cue){
      main.textContent='';
      main.append(document.createTextNode('Bygg, trykk '));
      cue=document.createElement('span');
      cue.id='v29-moon-cue';
      cue.textContent='🌙';
      cue.setAttribute('aria-label','måneknappen');
      main.append(cue,document.createTextNode(', og byen får en ny dag'));
    }
    const cs=getComputedStyle(night);
    cue.style.background=cs.background;
    cue.style.borderColor=cs.borderColor;
    cue.style.borderRadius=cs.borderRadius;
    cue.style.boxShadow=cs.boxShadow;
  }

  function restoreThought(el,icon){
    if(!el)return;
    const bubble=q('.cit-thought',el);
    if(!icon){
      if(bubble)bubble.remove();
      return;
    }
    if(!bubble)return;
    bubble.classList.remove('v27-empty-thought');
    const glyph=q('.cit-thought-icon',bubble);
    if(!glyph)return;
    glyph.classList.remove('v19-shared-icon','v20-shared-icon','v21-shared-icon','v23-shared-icon');
    glyph.classList.add('v29-plain-thought');
    glyph.dataset.v19Original=icon;
    delete glyph.dataset.v19Icon;
    glyph.replaceChildren(document.createTextNode(icon));
  }

  function wrapRuntime(){
    if(runtimeWrapped)return;
    runtimeWrapped=true;

    if(typeof citSetThought==='function'&&!citSetThought.__v29Wrapped){
      const base=citSetThought;
      const wrapped=function(el,icon){
        const r=base.apply(this,arguments);
        queueMicrotask(()=>restoreThought(el,icon));
        return r;
      };
      wrapped.__v29Wrapped=true;
      citSetThought=wrapped;
    }

    if(typeof citRenderTools==='function'&&!citRenderTools.__v29Wrapped){
      const base=citRenderTools;
      const wrapped=function(){
        const r=base.apply(this,arguments);
        queueMicrotask(()=>{arrangeFixedActions();enforceCategoryIcons();installCategoryScroller();fitAdaptiveRail();});
        requestAnimationFrame(()=>{arrangeFixedActions();enforceCategoryIcons();installCategoryScroller();fitAdaptiveRail();});
        return r;
      };
      wrapped.__v29Wrapped=true;
      citRenderTools=wrapped;
    }

    if(typeof citRenderHelp==='function'&&!citRenderHelp.__v29Wrapped){
      const base=citRenderHelp;
      const wrapped=function(){
        const r=base.apply(this,arguments);
        queueMicrotask(()=>{decorateMoonCue();fitAdaptiveRail();});
        return r;
      };
      wrapped.__v29Wrapped=true;
      citRenderHelp=wrapped;
    }
  }

  function scan(){
    scanQueued=false;
    installQuietButtonClicks();
    restoreGameExitButtons();
    wrapRuntime();
    const c=city();if(!c)return;
    c.classList.add('v29-repair');
    arrangeFixedActions();
    enforceCategoryIcons();
    installCategoryScroller();
    decorateMoonCue();
    fitAdaptiveRail();
    qa('#cit-grid .cit-thought').forEach(bubble=>{
      const glyph=q('.cit-thought-icon',bubble);
      if(!glyph)return;
      const remembered=glyph.dataset.v19Original;
      if(remembered && (!glyph.classList.contains('v29-plain-thought') || glyph.textContent.trim()!==remembered)){
        const person=bubble.closest('.citizen');
        restoreThought(person,remembered);
        return;
      }
      if(!glyph.textContent.trim()&&!glyph.children.length)bubble.remove();
    });
  }
  function queueScan(){if(scanQueued)return;scanQueued=true;requestAnimationFrame(scan);}

  installQuietButtonClicks();
  restoreGameExitButtons();
  wrapRuntime();

  const obs=new MutationObserver(queueScan);
  obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  addEventListener('resize',queueScan,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(queueScan,80),{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',queueScan,{passive:true});
  queueScan();
})();