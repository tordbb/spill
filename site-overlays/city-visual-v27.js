(function(){
  'use strict';

  const liveNeeds=new Set();
  let scanQueued=false;
  let wrapped=false;

  function q(sel,root=document){return root&&root.querySelector?root.querySelector(sel):null;}
  function qa(sel,root=document){return root&&root.querySelectorAll?[...root.querySelectorAll(sel)]:[];}
  function city(){return q('#g-cit');}
  function inSimulation(){const c=city();return !!(c&&c.classList.contains('v18-sim'));}

  function svg(markup,cls){
    const wrap=document.createElement('span');
    wrap.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" class="'+cls+'">'+markup+'</svg>';
    return wrap.firstElementChild;
  }

  function roadNetworkIcon(){
    return svg(
      '<path d="M15 23 H68 Q78 23 78 33 V78" fill="none" stroke="#535e61" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M22 77 H52 Q62 77 62 67 V48 Q62 39 52 39 H34 Q24 39 24 49 V60" fill="none" stroke="#667174" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M15 23 H68 Q78 23 78 33 V78 M22 77 H52 Q62 77 62 67 V48 Q62 39 52 39 H34 Q24 39 24 49 V60" fill="none" stroke="#fff0b8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6 8"/>'+
      '<circle cx="24" cy="39" r="5" fill="#344145"/><circle cx="62" cy="39" r="5" fill="#344145"/><circle cx="62" cy="77" r="5" fill="#344145"/>',
      'v27-road-network');
  }

  function decorateRoadCategory(){
    const all=qa('#cit-tools .v23-category-col > .v23-tool-btn');
    const edit=b=>b.id==='cit-undo'||b.classList.contains('v23-undo')||b.classList.contains('v23-broom')||b.hasAttribute('data-v30-fixed-action');
    all.filter(edit).forEach(b=>{
      b.removeAttribute('data-v27-road');
      qa(':scope > .v27-road-network',b).forEach(el=>el.remove());
    });
    const b=q('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category="0"]')||
      all.find(x=>!edit(x)&&x.dataset.v26Category==='0')||
      all.find(x=>!edit(x));
    if(!b||b.dataset.v27Road==='1')return;
    qa(':scope > .v26-category-svg,:scope > .v23-tool-icon,:scope > .v19-tool-glyph',b).forEach(el=>el.remove());
    b.prepend(roadNetworkIcon());
    b.dataset.v27Road='1';
  }

  function separatePanels(){
    const c=city(),rail=q('#v23-rail',c),info=q('#v23-info',c),tools=q('#cit-tools',c);
    if(!c||!rail||!info||!tools)return;
    c.classList.add('v27-panels');

    /* Keep edit actions in the category column. A separate grid row rotates outside
       the compact rail on portrait phones and can become unreachable. */
    const cats=q('.v23-category-col',tools);
    const actions=q('#v27-edit-actions',tools);
    if(cats&&actions){
      [...actions.children].forEach(el=>cats.appendChild(el));
      actions.remove();
    }
    if(cats&&!q(':scope > .v23-edit-sep',cats)){
      const broom=q(':scope > .v23-broom,[aria-label="Fjern"]',cats);
      if(broom){
        const sep=document.createElement('div');sep.className='v23-edit-sep';
        cats.insertBefore(sep,broom);
      }
    }
  }

  function thoughtBubble(glyph){
    if(!glyph)return null;
    let p=glyph.parentElement;
    while(p&&p!==city()){
      const name=((p.className&&typeof p.className==='string'?p.className:'')+' '+(p.id||'')).toLowerCase();
      if(/thought|bubble|tenk/.test(name))return p;
      if(p.classList&&p.classList.contains('citizen'))break;
      p=p.parentElement;
    }
    const parent=glyph.parentElement;
    return parent&&!(parent.classList&&parent.classList.contains('citizen'))?parent:null;
  }

  function glyphHasContent(glyph){
    if(!glyph)return false;
    if((glyph.textContent||'').trim())return true;
    return !!q(':scope > .v23-shared-symbol,:scope > .v21-shared-svg,:scope > .v20-shared-svg,:scope > svg,:scope > img',glyph);
  }

  function cleanThoughts(){
    qa('#cit-grid .cit-thought-icon').forEach(glyph=>{
      const bubble=thoughtBubble(glyph);
      if(bubble)bubble.classList.toggle('v27-empty-thought',!glyphHasContent(glyph));
    });
  }

  function renderLiveNeeds(){
    const tip=q('#cit-help-tip');
    if(!tip)return;
    if(!inSimulation())return;
    tip.innerHTML='';
    const lead=document.createElement('span');lead.className='v27-live-lead';lead.textContent='Tips: Bygg det de tenker på:';tip.appendChild(lead);
    const wrap=document.createElement('span');wrap.className='v27-live-needs';tip.appendChild(wrap);
    liveNeeds.forEach(icon=>{
      const s=document.createElement('span');s.className='v18-need-icon v27-live-need';s.textContent=icon;wrap.appendChild(s);
    });
    tip.style.display='';
  }

  function restoreNormalHelp(){
    try{if(typeof citRenderHelp==='function')citRenderHelp();}catch(e){}
  }

  function wrapRuntime(){
    if(wrapped)return;wrapped=true;

    if(typeof citNoteNeed==='function'){
      const base=citNoteNeed;
      citNoteNeed=function(icon){
        const r=base.apply(this,arguments);
        if(icon&&inSimulation()){
          liveNeeds.add(icon);
          queueMicrotask(renderLiveNeeds);
        }
        return r;
      };
    }

    if(typeof citSetThought==='function'){
      const base=citSetThought;
      citSetThought=function(el,icon){
        const r=base.apply(this,arguments);
        queueMicrotask(()=>{
          if(el){
            const glyph=q('.cit-thought-icon',el);
            const bubble=thoughtBubble(glyph);
            if(!icon){
              if(glyph){
                glyph.textContent='';
                glyph.removeAttribute('data-v19-icon');
                glyph.removeAttribute('data-v19-original');
                qa(':scope > *',glyph).forEach(n=>n.remove());
              }
              if(bubble)bubble.classList.add('v27-empty-thought');
            }else{
              if(bubble)bubble.classList.remove('v27-empty-thought');
              if(inSimulation()){
                liveNeeds.add(icon);
                renderLiveNeeds();
              }
            }
          }
          cleanThoughts();
        });
        return r;
      };
    }

    if(typeof citNight==='function'){
      const base=citNight;
      citNight=async function(){
        liveNeeds.clear();
        const r=base.apply(this,arguments);
        queueMicrotask(renderLiveNeeds);
        try{return await r;}
        finally{
          liveNeeds.clear();
          queueMicrotask(()=>{cleanThoughts();restoreNormalHelp();});
        }
      };
    }
  }

  function scan(){
    scanQueued=false;
    const c=city();if(!c)return;
    c.classList.add('v27-ui');
    decorateRoadCategory();
    separatePanels();
    cleanThoughts();
    if(inSimulation())renderLiveNeeds();
    requestAnimationFrame(()=>{try{if(typeof citFitBoard==='function')citFitBoard();}catch(e){}});
  }
  function queueScan(){if(scanQueued)return;scanQueued=true;requestAnimationFrame(scan);}

  wrapRuntime();
  const c=city();if(c){
    const obs=new MutationObserver(queueScan);obs.observe(c,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  }
  addEventListener('resize',queueScan,{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',queueScan,{passive:true});
  queueScan();
})();