(function(){
  'use strict';

  let homeSource=null,menuSource=null,scanQueued=false,fitQueued=false;

  function q(sel,root=document){return root&&root.querySelector?root.querySelector(sel):null;}
  function qa(sel,root=document){return root&&root.querySelectorAll?[...root.querySelectorAll(sel)]:[];}
  function city(){return q('#g-cit');}
  function text(el){return [el&&el.textContent,el&&el.id,typeof(el&&el.className)==='string'?el.className:'',el&&el.getAttribute&&el.getAttribute('aria-label'),el&&el.title].filter(Boolean).join(' ').toLowerCase();}
  function visible(el){
    if(!el||el.matches('.v25-nav-proxy'))return false;
    const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;
    const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight;
  }
  function controls(){return qa('button,[role="button"],input[type="button"],input[type="submit"]');}
  function findHome(){
    const all=controls();
    return all.find(el=>visible(el)&&el.classList&&el.classList.contains('nav-home'))||
      all.find(el=>visible(el)&&((el.textContent||'').includes('🏡')||/\b(hjem|home|avslutt spill)\b/.test(text(el))))||
      q('.nav-home');
  }
  function findMenu(){
    const all=controls().filter(el=>el.id!=='cit-clear'&&!(el.closest&&el.closest('#cit-tools'))&&!el.matches('#v25-menu'));
    return all.find(el=>visible(el)&&(el.textContent||'').includes('⚙'))||
      all.find(el=>visible(el)&&/(settings?|innstill|gear|cog)/.test(text(el)))||
      all.find(el=>(el.textContent||'').includes('⚙'))||null;
  }

  function makeProxy(id,label){
    let b=q('#'+id);if(b)return b;
    b=document.createElement('button');b.id=id;b.type='button';b.className='v25-nav-proxy';b.setAttribute('aria-label',label);return b;
  }
  function markSource(el,kind){
    if(!el)return;
    el.classList.add('v25-nav-source');el.dataset.v25NavSource=kind;
  }
  function sourceFor(kind){
    const cached=kind==='home'?homeSource:menuSource;
    if(cached&&cached.isConnected)return cached;
    const el=q('[data-v25-nav-source="'+kind+'"]');
    if(kind==='home')homeSource=el;else menuSource=el;return el;
  }
  function anchorAndClick(kind,proxy){
    const src=sourceFor(kind);if(!src)return;
    const r=proxy.getBoundingClientRect();
    src.classList.add('v25-anchor-source');
    src.style.setProperty('left',r.left+'px','important');src.style.setProperty('top',r.top+'px','important');
    src.style.setProperty('width',Math.max(1,r.width)+'px','important');src.style.setProperty('height',Math.max(1,r.height)+'px','important');
    try{src.click();}catch(e){}
    if(kind==='menu')setTimeout(()=>{
      const f=q('#v24-settings-fallback');const slot=q('#v25-nav-slot');if(f&&slot&&f.classList.contains('show')&&f.parentNode!==slot)slot.appendChild(f);
    },220);
    setTimeout(()=>{
      if(!src.isConnected)return;src.classList.remove('v25-anchor-source');
      src.style.removeProperty('left');src.style.removeProperty('top');src.style.removeProperty('width');src.style.removeProperty('height');
    },420);
  }

  function ensureNav(){
    const c=city(),info=q('#v23-info',c);if(!c||!info)return;
    c.classList.add('v25-controls');
    let slot=q('#v25-nav-slot',c);
    if(!slot){slot=document.createElement('div');slot.id='v25-nav-slot';info.insertBefore(slot,info.firstChild);}
    const exit=makeProxy('v25-exit','Avslutt spill'),menu=makeProxy('v25-menu','Meny');
    if(exit.parentNode!==slot)slot.appendChild(exit);if(menu.parentNode!==slot)slot.appendChild(menu);
    if(!exit.dataset.v25Bound){exit.dataset.v25Bound='1';exit.addEventListener('click',()=>anchorAndClick('home',exit));}
    if(!menu.dataset.v25Bound){menu.dataset.v25Bound='1';menu.addEventListener('click',()=>anchorAndClick('menu',menu));}

    const h=findHome();if(h&&h!==exit){homeSource=h;markSource(h,'home');}
    const g=findMenu();if(g&&g!==menu){menuSource=g;markSource(g,'menu');}

    const top=q('.top-bar',c);
    if(top){
      const meaningful=[...top.children].filter(el=>!el.classList.contains('v25-nav-source')&&el.id!=='v24-settings-fallback'&&el.textContent.trim());
      top.classList.toggle('v25-source-only',meaningful.length===0);
    }
  }

  function ensureActions(){
    const c=city(),right=q('#cit-right',c);if(!c||!right)return;
    c.classList.add('v25-controls');
    let slot=q('#v25-action-slot',right);
    if(!slot){slot=document.createElement('div');slot.id='v25-action-slot';right.appendChild(slot);}
    const stats=q('#cit-pop-wrap',c),night=q('#cit-night',c);
    if(stats&&stats.parentNode!==slot)slot.appendChild(stats);
    if(night&&night.parentNode!==slot)slot.appendChild(night);
  }

  function queueFit(){
    if(fitQueued)return;fitQueued=true;
    requestAnimationFrame(()=>{fitQueued=false;try{if(city()&&city().classList.contains('active')&&typeof citFitBoard==='function')citFitBoard();}catch(e){}});
  }
  function scan(){
    scanQueued=false;ensureNav();ensureActions();queueFit();
  }
  function queueScan(){if(scanQueued)return;scanQueued=true;requestAnimationFrame(scan);}

  const obs=new MutationObserver(queueScan);obs.observe(document.body,{childList:true,subtree:true});
  addEventListener('resize',queueScan,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(queueScan,80),{passive:true});
  if(window.visualViewport)visualViewport.addEventListener('resize',queueScan,{passive:true});
  queueScan();
})();
