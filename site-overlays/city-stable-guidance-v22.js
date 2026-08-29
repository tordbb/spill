(function(){
  'use strict';

  const BENCH_TOKEN='__BENCH__';
  const MAIN_TEXT='Bygg, trykk 🌙, og byen får en ny dag';
  const chairGlyph=String.fromCodePoint(0x1FA91);
  let busIconSerial=0;

  const style=document.createElement('style');
  style.id='city-stable-guidance-v22-style';
  style.textContent=`
    .stable-bench-icon{display:inline-flex;align-items:center;justify-content:center;width:1.18em;height:1.18em;vertical-align:-.16em;line-height:1;flex:0 0 auto}
    .stable-bench-icon svg{display:block;width:100%;height:100%;overflow:visible}
    .ct>.stable-bench-icon{position:absolute;inset:4%;width:92%;height:92%;margin:auto;pointer-events:none;filter:drop-shadow(0 1px 1px #0003)}
    .cbtn>.stable-bench-icon{width:1.35em;height:1.35em}
    .cit-thought-icon>.stable-bench-icon,.v18-need-icon>.stable-bench-icon{width:1em;height:1em;vertical-align:0}
    #cit-help-tip>.stable-bench-icon{width:1.05em;height:1.05em;margin-left:.12em}
    .cit-bus-stop.stable-line-stop{border:0!important;background:transparent!important;filter:none!important}
    .cit-bus-stop>.stable-line-stop-icon{position:absolute;inset:9%;display:block;color:var(--bus-color);pointer-events:none}
    .cit-bus-stop.end>.stable-line-stop-icon{inset:7%}
    .stable-line-stop-icon svg{display:block;width:100%;height:100%;overflow:visible;color:inherit}
  `;
  document.head.appendChild(style);

  function benchIcon(){
    const span=document.createElement('span');
    span.className='stable-bench-icon';
    span.setAttribute('role','img');
    span.setAttribute('aria-label','Benk');
    span.innerHTML='<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><ellipse cx="51" cy="84" rx="35" ry="5" fill="#213d2925"/><path d="M17 43 Q18 38 24 38 H78 Q84 38 84 44 V55 H17Z" fill="#9c633d"/><rect x="20" y="59" width="62" height="12" rx="4" fill="#be7b48"/><path d="M28 69 V86 M73 69 V86" stroke="#71462f" stroke-width="8" stroke-linecap="round"/></svg>';
    return span;
  }

  function busStopIcon(isEnd){
    const span=document.createElement('span');
    span.className='stable-line-stop-icon';
    span.dataset.kind=isEnd?'end':'mid';
    const maskId='stable-bus-mask-'+(++busIconSerial);
    if(isEnd){
      span.innerHTML=`<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <rect width="120" height="120" fill="#fff"/>
          <rect x="38" y="48" width="28" height="10" rx="5" fill="#000"/>
          <rect x="35" y="66" width="36" height="22" rx="5" fill="#000"/>
          <circle cx="40" cy="95" r="6.5" fill="#000"/>
          <circle cx="66" cy="95" r="6.5" fill="#000"/>
        </mask></defs>
        <path d="M13 23 L107 37 M18 28 V108 M105 37 V108" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="27" y="38" width="50" height="66" rx="12" fill="currentColor" mask="url(#${maskId})"/>
        <rect x="32" y="99" width="13" height="14" rx="5" fill="currentColor"/>
        <rect x="60" y="99" width="13" height="14" rx="5" fill="currentColor"/>
        <path d="M81 88 H95 M84 88 V108 M93 88 V108 M95 88 L101 63" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }else{
      span.innerHTML=`<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
          <rect width="120" height="120" fill="#fff"/>
          <rect x="26" y="25" width="36" height="10" rx="5" fill="#000"/>
          <rect x="22" y="45" width="44" height="28" rx="5" fill="#000"/>
          <circle cx="28" cy="85" r="7.5" fill="#000"/>
          <circle cx="60" cy="85" r="7.5" fill="#000"/>
        </mask></defs>
        <rect x="12" y="14" width="64" height="82" rx="14" fill="currentColor" mask="url(#${maskId})"/>
        <rect x="20" y="91" width="14" height="16" rx="5" fill="currentColor"/>
        <rect x="56" y="91" width="14" height="16" rx="5" fill="currentColor"/>
        <path d="M84 82 H102 M87 82 V105 M100 82 V105 M102 82 L109 52" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
    return span;
  }

  function decorateBusStops(root){
    if(!root||!root.querySelectorAll)return;
    root.querySelectorAll('.cit-bus-stop').forEach(stop=>{
      const isEnd=stop.classList.contains('end');
      stop.classList.add('stable-line-stop');
      stop.querySelectorAll(':scope > .cit-bus-word,:scope > .cit-bus-end-word,:scope > .cit-bus-end-sign').forEach(el=>el.remove());
      let icon=stop.querySelector(':scope > .stable-line-stop-icon');
      const kind=isEnd?'end':'mid';
      if(!icon||icon.dataset.kind!==kind){
        if(icon)icon.remove();
        icon=busStopIcon(isEnd);
        const warning=stop.querySelector(':scope > .cit-bus-warning');
        stop.insertBefore(icon,warning||null);
      }
    });
  }

  function replaceBenchTokens(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()){
      const n=walker.currentNode;
      if(n.nodeValue&&n.nodeValue.includes(BENCH_TOKEN))nodes.push(n);
    }
    for(const node of nodes){
      const parts=node.nodeValue.split(BENCH_TOKEN);
      const frag=document.createDocumentFragment();
      parts.forEach((part,i)=>{
        if(part)frag.appendChild(document.createTextNode(part));
        if(i<parts.length-1)frag.appendChild(benchIcon());
      });
      node.replaceWith(frag);
    }
  }

  function migrateNeeds(){
    let changed=false;
    if(typeof S!=='undefined'&&S&&Array.isArray(S.v18CurrentNeeds)){
      S.v18CurrentNeeds=S.v18CurrentNeeds.map(icon=>{
        if(icon===chairGlyph||icon===BENCH_TOKEN)return BENCH_TOKEN;
        return icon;
      });
      changed=true;
    }
    try{
      if(typeof citNeedIcons!=='undefined'&&citNeedIcons&&typeof citNeedIcons.has==='function'&&citNeedIcons.has(chairGlyph)){
        citNeedIcons.delete(chairGlyph);citNeedIcons.add(BENCH_TOKEN);changed=true;
      }
    }catch(e){}
    if(changed&&typeof save==='function')save();
  }

  function currentNeeds(){
    const out=[];
    const add=icon=>{
      if(!icon)return;
      if(icon===chairGlyph)icon=BENCH_TOKEN;
      if(!out.includes(icon))out.push(icon);
    };
    try{
      if(typeof citHelpMode!=='undefined'&&citHelpMode==='needs'&&typeof citNeedIcons!=='undefined')for(const icon of citNeedIcons)add(icon);
    }catch(e){}
    try{if(typeof S!=='undefined'&&S&&Array.isArray(S.v18CurrentNeeds))S.v18CurrentNeeds.forEach(add);}catch(e){}
    return out;
  }

  function appendNeed(tip,icon){
    if(icon===BENCH_TOKEN||icon===chairGlyph){tip.appendChild(benchIcon());return;}
    const s=document.createElement('span');s.textContent=icon;tip.appendChild(s);
  }

  function stableRenderHelp(){
    const main=document.querySelector('#cit-help-main'),tip=document.querySelector('#cit-help-tip');
    if(!main||!tip)return;
    main.textContent=MAIN_TEXT;
    let mode='default';
    try{mode=typeof citHelpMode!=='undefined'?citHelpMode:'default';}catch(e){}
    if(mode==='undo'){
      tip.textContent='Tips: Angre med ↶';tip.style.display='';return;
    }
    if(mode==='road'){
      tip.textContent='Tips: alt må ha vei for å besøkes';tip.style.display='';return;
    }
    const needs=currentNeeds();
    if(needs.length){
      tip.textContent='';tip.appendChild(document.createTextNode('Tips: Bygg det de tenker på: '));
      needs.forEach(icon=>appendNeed(tip,icon));tip.style.display='';return;
    }
    tip.textContent='';tip.style.display='none';
  }

  function decorateCity(){
    const city=document.querySelector('#g-cit');
    if(city){replaceBenchTokens(city);decorateBusStops(city);}
  }

  migrateNeeds();

  try{
    if(typeof CIT_EMO!=='undefined'&&CIT_EMO)CIT_EMO.B=BENCH_TOKEN;
  }catch(e){}

  if(typeof citRenderHelp==='function')citRenderHelp=stableRenderHelp;

  if(typeof citRenderTools==='function'){
    const base=citRenderTools;
    citRenderTools=function(){const r=base.apply(this,arguments);decorateCity();return r;};
  }
  if(typeof citRenderTiles==='function'){
    const base=citRenderTiles;
    citRenderTiles=function(){const r=base.apply(this,arguments);decorateCity();return r;};
  }
  if(typeof citRenderBusNetwork==='function'){
    const base=citRenderBusNetwork;
    citRenderBusNetwork=function(){const r=base.apply(this,arguments);decorateCity();return r;};
  }
  if(typeof citSetThought==='function'){
    const base=citSetThought;
    citSetThought=function(el,icon){
      if(icon===chairGlyph)icon=BENCH_TOKEN;
      const r=base.call(this,el,icon);if(el)replaceBenchTokens(el);return r;
    };
  }

  const help=document.querySelector('#cit-help');
  if(help){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;queued=true;
      queueMicrotask(()=>{
        queued=false;
        const main=document.querySelector('#cit-help-main');
        if(main&&main.textContent!==MAIN_TEXT)stableRenderHelp();
        decorateCity();
      });
    });
    observer.observe(help,{childList:true,subtree:true,characterData:true});
  }

  const city=document.querySelector('#g-cit');
  if(city){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;decorateCity();});
    });
    observer.observe(city,{childList:true,subtree:true});
  }

  stableRenderHelp();
  decorateCity();
})();
