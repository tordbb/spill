(function(){
  'use strict';

  const MAX_CONTENT_SLOTS=7;
  let scanQueued=false;
  let fitQueued=false;
  let muteUntil=0;

  function q(sel,root=document){return root&&root.querySelector?root.querySelector(sel):null;}
  function qa(sel,root=document){return root&&root.querySelectorAll?[...root.querySelectorAll(sel)]:[];}
  function city(){return q('#g-cit');}
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}

  function installButtonSoundMute(){
    const root=document.documentElement;
    if(!root.dataset.v28MuteEvents){
      root.dataset.v28MuteEvents='1';
      const arm=e=>{
        if(e.target&&e.target.closest&&e.target.closest('button,[role="button"],input[type="button"],input[type="submit"]')){
          muteUntil=performance.now()+180;
        }
      };
      ['pointerdown','mousedown','touchstart','click','keydown'].forEach(type=>document.addEventListener(type,arm,true));
    }
    try{
      if(typeof sfx==='function'&&!sfx.__v28ButtonSoundMute){
        const base=sfx;
        const wrapped=function(){
          if(performance.now()<muteUntil)return;
          return base.apply(this,arguments);
        };
        wrapped.__v28ButtonSoundMute=true;
        wrapped.__v28Base=base;
        sfx=wrapped;
        try{window.sfx=wrapped;}catch(e){}
      }
    }catch(e){}
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
      'v28-category-svg v28-road-network');
  }
  function roofIcon(){
    return svg(
      '<path d="M8 72 L50 27 L92 72" fill="#d8534f" stroke="#7b3532" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<path d="M67 40 V17 H79 V54" fill="#b96549" stroke="#7b3532" stroke-width="5" stroke-linejoin="round"/>',
      'v28-category-svg v28-roof');
  }
  function parkIcon(){
    return svg(
      '<path d="M7 82 Q50 69 93 82 V94 H7Z" fill="#62a953"/>'+
      '<path d="M27 79 V58 M51 79 V48 M76 79 V60" stroke="#765035" stroke-width="7" stroke-linecap="round"/>'+
      '<circle cx="27" cy="48" r="18" fill="#4f9d54" stroke="#36763c" stroke-width="4"/>'+
      '<circle cx="51" cy="35" r="22" fill="#5cac55" stroke="#36763c" stroke-width="4"/>'+
      '<circle cx="76" cy="50" r="17" fill="#438d4c" stroke="#326f39" stroke-width="4"/>',
      'v28-category-svg v28-park');
  }

  const CATEGORY_ICONS=[
    {cls:'v28-road-network',make:roadIcon},
    {cls:'v28-roof',make:roofIcon},
    {cls:'v28-park',make:parkIcon}
  ];

  function enforceCategoryIcons(){
    const buttons=qa('#cit-tools .v23-category-col > .v23-tool-btn').slice(0,3);
    buttons.forEach((b,i)=>{
      const spec=CATEGORY_ICONS[i];if(!spec)return;
      const correct=q(':scope > .'+spec.cls,b);
      qa(':scope > .v26-category-svg,:scope > .v23-tool-icon,:scope > .v19-tool-glyph,:scope > .v28-category-svg',b)
        .forEach(el=>{if(el!==correct)el.remove();});
      if(!correct)b.prepend(spec.make());
      b.dataset.v28Category=String(i);
    });
  }

  function ensureEditActions(){
    const tools=q('#cit-tools');if(!tools)return;
    let box=q('#v28-edit-actions',tools);
    if(!box){
      box=document.createElement('div');box.id='v28-edit-actions';
      const old=q('#v27-edit-actions',tools);
      if(old){
        while(old.firstChild)box.appendChild(old.firstChild);
        old.replaceWith(box);
      }else tools.appendChild(box);
    }
    const broom=q('.v23-broom,[aria-label="Fjern"]',tools);
    const undo=q('#cit-undo',tools);
    [broom,undo].filter(Boolean).forEach(el=>{if(el.parentNode!==box)box.appendChild(el);});
    qa('.v23-edit-sep',tools).forEach(el=>el.remove());
  }

  function setCompactMode(){
    const c=city(),rail=q('#v23-rail',c);if(!c||!rail)return false;
    const h=rail.clientHeight||q('.stage-wrap',c)?.clientHeight||0;
    const compact=h>0&&h<520;
    c.classList.toggle('v28-compact',compact);
    return compact;
  }

  function candidateButtonSize(){
    const c=city(),rail=q('#v23-rail',c),info=q('#v23-info',c);
    if(!c||!rail)return 27;
    const compact=c.classList.contains('v28-compact');
    const railH=rail.clientHeight||360;
    const infoH=info?info.getBoundingClientRect().height:0;
    const available=compact?railH-8:Math.max(170,railH-infoH-12);
    return clamp(Math.floor((available-22)/(MAX_CONTENT_SLOTS+1)),20,31);
  }

  function fitsRail(){
    const c=city(),rail=q('#v23-rail',c),tools=q('#cit-tools',c);
    if(!c||!rail||!tools)return true;
    const rr=rail.getBoundingClientRect(),tr=tools.getBoundingClientRect();
    const eps=2;
    const toolInside=tr.left>=rr.left-eps&&tr.right<=rr.right+eps&&tr.top>=rr.top-eps&&tr.bottom<=rr.bottom+eps;
    const buttons=qa('.v23-category-col > .v23-tool-btn,.v23-content-col > .v23-tool-btn,#v28-edit-actions > .v23-tool-btn',tools);
    const allInside=buttons.every(b=>{
      const r=b.getBoundingClientRect();
      return r.left>=rr.left-eps&&r.right<=rr.right+eps&&r.top>=rr.top-eps&&r.bottom<=rr.bottom+eps;
    });
    return toolInside&&allInside;
  }

  function fitToolPanel(){
    const c=city(),rail=q('#v23-rail',c),tools=q('#cit-tools',c);
    if(!c||!rail||!tools)return;
    setCompactMode();
    let size=candidateButtonSize();
    rail.style.setProperty('--v23-btn',size+'px');
    for(let i=0;i<12&&!fitsRail()&&size>18;i++){
      size-=1;
      rail.style.setProperty('--v23-btn',size+'px');
    }
    c.dataset.v28ToolSize=String(size);
    c.classList.toggle('v28-tool-overflow',!fitsRail());
  }

  function decorateMoonCue(){
    const main=q('#cit-help-main'),night=q('#cit-night');if(!main||!night)return;
    const wanted='Bygg, trykk 🌙, og byen får en ny dag';
    if(main.textContent.trim()!==wanted&&!main.querySelector('#v28-moon-cue'))return;
    let cue=q('#v28-moon-cue',main);
    if(!cue){
      main.textContent='';
      main.append(document.createTextNode('Bygg, trykk '));
      cue=document.createElement('span');cue.id='v28-moon-cue';cue.textContent='🌙';cue.setAttribute('aria-label','måneknappen');
      main.append(cue,document.createTextNode(', og byen får en ny dag'));
    }
    const cs=getComputedStyle(night);
    cue.style.backgroundColor=cs.backgroundColor;
    cue.style.borderRadius=cs.borderRadius;
    cue.style.boxShadow=cs.boxShadow;
    cue.style.borderColor=cs.borderColor;
  }

  function keepDeleteVisible(){
    const c=city();if(!c)return;
    const menu=q('#v26-settings-menu');
    const info=q('#v23-info',c),nav=q('#v25-nav-slot',c);
    if(menu&&info&&menu.parentNode!==info){
      if(nav&&nav.nextSibling)info.insertBefore(menu,nav.nextSibling);else info.insertBefore(menu,info.firstChild);
    }
    if(menu)info?.classList.toggle('v28-fallback-open',menu.classList.contains('show'));

    const del=q('#v26-delete-setting')||q('#v24-delete-setting');
    if(del){
      const row=del.closest('.v26-settings-delete-row,.v24-settings-delete-row');
      if(row){
        row.classList.add('v28-delete-row');
        const panel=row.parentElement;
        if(panel&&panel!==info&&panel.id!=='v26-settings-menu'){
          const first=panel.firstElementChild;
          if(first&&first!==row)panel.insertBefore(row,first.nextSibling);
        }
      }
    }
  }

  function queueFit(){
    if(fitQueued)return;fitQueued=true;
    requestAnimationFrame(()=>{
      fitQueued=false;
      fitToolPanel();
      try{if(city()&&city().classList.contains('active')&&typeof citFitBoard==='function')citFitBoard();}catch(e){}
      requestAnimationFrame(fitToolPanel);
    });
  }

  function audit(){
    const c=city(),tools=q('#cit-tools',c);
    if(!c||!tools)return {ready:false};
    const undo=q('#cit-undo',tools);
    const road=q('.v23-category-col > .v23-tool-btn .v28-road-network',tools);
    const parkSlots=qa('.v23-content-col > .v23-tool-btn',tools).length;
    const result={
      ready:true,
      toolSize:Number(c.dataset.v28ToolSize||0),
      overflow:!fitsRail(),
      undoPresent:!!undo,
      roadStable:!!road,
      currentContentButtons:parkSlots,
      moonCue:!!q('#v28-moon-cue',c),
      buttonSoundMute:true
    };
    c.dataset.v28Audit=result.overflow?'overflow':'ok';
    return result;
  }
  try{window.__cityV28Audit=audit;}catch(e){}

  function scan(){
    scanQueued=false;
    const c=city();if(!c)return;
    c.classList.add('v28-hardened');
    installButtonSoundMute();
    enforceCategoryIcons();
    ensureEditActions();
    decorateMoonCue();
    keepDeleteVisible();
    queueFit();
    requestAnimationFrame(audit);
  }
  function queueScan(){if(scanQueued)return;scanQueued=true;requestAnimationFrame(scan);}

  installButtonSoundMute();

  if(typeof citRenderTools==='function'&&!citRenderTools.__v28Wrapped){
    const base=citRenderTools;
    const wrapped=function(){
      const r=base.apply(this,arguments);
      queueMicrotask(()=>{enforceCategoryIcons();ensureEditActions();queueFit();});
      requestAnimationFrame(()=>{enforceCategoryIcons();ensureEditActions();queueFit();});
      return r;
    };
    wrapped.__v28Wrapped=true;
    citRenderTools=wrapped;
  }

  const c=city();
  if(c){
    const obs=new MutationObserver(queueScan);
    obs.observe(c,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  addEventListener('resize',queueScan,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(queueScan,80),{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',queueScan,{passive:true});
  queueScan();
})();