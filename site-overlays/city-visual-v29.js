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
    const cats=q('#cit-tools .v23-category-col');
    if(!cats)return;
    const broom=q(':scope > .v23-broom,[aria-label="Fjern"]',cats);
    const undo=q(':scope > #cit-undo',cats);
    const categories=qa(':scope > .v23-tool-btn',cats).filter(btn=>btn!==broom&&btn!==undo);
    let sep=q(':scope > .v30-edit-sep',cats)||q(':scope > .v23-edit-sep',cats);
    if(!sep){sep=document.createElement('div');}
    sep.className='v23-edit-sep v30-edit-sep';
    sep.setAttribute('aria-hidden','true');
    if(broom)broom.dataset.v30FixedAction='remove';
    if(undo)undo.dataset.v30FixedAction='undo';
    cats.replaceChildren(...[broom,undo,sep,...categories].filter(Boolean));
  }

  function enforceCategoryIcons(){
    const buttons=qa('#cit-tools .v23-category-col > .v23-tool-btn')
      .filter(btn=>!btn.classList.contains('v23-broom')&&btn.id!=='cit-undo')
      .slice(0,3);
    buttons.forEach((btn,i)=>{
      const spec=categoryIcons[i];if(!spec)return;
      let keep=q(':scope > .'+spec.cls,btn);
      qa(':scope > .v26-category-svg,:scope > .v23-tool-icon,:scope > .v19-tool-glyph,:scope > .v27-road-network,:scope > .v28-category-svg,:scope > .v29-category-svg',btn)
        .forEach(el=>{if(el!==keep)el.remove();});
      if(!keep){keep=spec.make();btn.prepend(keep);}
      btn.dataset.v29Category=String(i);
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
        queueMicrotask(()=>{arrangeFixedActions();enforceCategoryIcons();});
        requestAnimationFrame(()=>{arrangeFixedActions();enforceCategoryIcons();});
        return r;
      };
      wrapped.__v29Wrapped=true;
      citRenderTools=wrapped;
    }

    if(typeof citRenderHelp==='function'&&!citRenderHelp.__v29Wrapped){
      const base=citRenderHelp;
      const wrapped=function(){
        const r=base.apply(this,arguments);
        queueMicrotask(decorateMoonCue);
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
    decorateMoonCue();
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
  if(window.visualViewport)visualViewport.addEventListener('resize',queueScan,{passive:true});
  queueScan();
})();