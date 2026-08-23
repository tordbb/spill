(function(){
  'use strict';

  const V24_MAIN_TEXT='Bygg, trykk 🌙, og byen får en ny dag';
  const V24_DAYS=['M','T','O','T','F','L','S'];
  let v24HelpBusy=false;
  let v24ScanQueued=false;
  let v24Gear=null;

  function q(sel,root=document){return root&&root.querySelector?root.querySelector(sel):null;}
  function qa(sel,root=document){return root&&root.querySelectorAll?[...root.querySelectorAll(sel)]:[];}
  function city(){return q('#g-cit');}

  function v24Needs(){
    const out=[];
    const add=x=>{if(x&&!out.includes(x))out.push(x);};
    try{
      if(typeof citHelpMode!=='undefined'&&citHelpMode==='needs'&&typeof citNeedIcons!=='undefined'&&citNeedIcons){
        if(typeof citNeedIcons.forEach==='function')citNeedIcons.forEach(add);
      }
    }catch(e){}
    try{if(typeof S!=='undefined'&&S&&Array.isArray(S.v18CurrentNeeds))S.v18CurrentNeeds.forEach(add);}catch(e){}
    return out;
  }

  function v24AppendNeed(tip,icon){
    const s=document.createElement('span');
    s.className='v18-need-icon v24-need-icon';
    s.textContent=icon;
    tip.appendChild(s);
  }

  function v24RenderHelp(){
    const main=q('#cit-help-main'),tip=q('#cit-help-tip');
    if(!main||!tip||v24HelpBusy)return;
    v24HelpBusy=true;
    try{
      main.textContent=V24_MAIN_TEXT;
      let mode='default';
      try{mode=typeof citHelpMode!=='undefined'?citHelpMode:'default';}catch(e){}
      if(mode==='undo'){
        tip.textContent='Tips: Angre med ↶';tip.style.display='';return;
      }
      if(mode==='road'){
        tip.textContent='Tips: alt må ha vei for å besøkes';tip.style.display='';return;
      }
      const needs=v24Needs();
      if(needs.length){
        tip.textContent='';
        const lead=document.createElement('span');lead.className='v24-help-lead';lead.textContent='Tips: Bygg det de tenker på:';tip.appendChild(lead);
        needs.forEach(icon=>v24AppendNeed(tip,icon));
        tip.style.display='';
      }else{
        tip.textContent='';tip.style.display='none';
      }
    }finally{
      v24HelpBusy=false;
    }
  }

  /* v18 sometimes calls its private renderer directly. Keep the public text restored even then. */
  if(typeof citRenderHelp==='function')citRenderHelp=v24RenderHelp;

  function v24LabelWeek(){
    const rows=qa('#cit-week .dayrow');
    rows.slice(0,7).forEach((row,i)=>{
      row.dataset.v24Day=V24_DAYS[i];
      row.classList.toggle('v24-saturday',i===5);
      row.classList.toggle('v24-sunday',i===6);
    });
  }
  if(typeof citHud==='function'){
    const baseHud=citHud;
    citHud=function(){const r=baseHud.apply(this,arguments);queueMicrotask(v24LabelWeek);return r;};
  }

  function v24ButtonText(el){
    return [el&&el.textContent,el&&el.id,el&&el.className,el&&el.getAttribute&&el.getAttribute('aria-label'),el&&el.title]
      .filter(Boolean).join(' ').toLowerCase();
  }
  function v24FindHome(c){
    return q('.nav-home',c)||qa('button,[role="button"]',c).find(b=>/\b(hjem|home|tilbake)\b/.test(v24ButtonText(b)))||null;
  }
  function v24FindGear(c){
    return qa('button,[role="button"]',c).find(b=>{
      if(b.id==='cit-clear'||b.closest&&b.closest('#cit-tools'))return false;
      const t=v24ButtonText(b);
      return (b.textContent||'').includes('⚙')||/(settings?|innstill|gear|cog)/.test(t);
    })||null;
  }

  function v24ArrangeNav(){
    const c=city();if(!c)return;
    const top=q('.top-bar',c),home=v24FindHome(c),gear=v24FindGear(c);if(!top)return;
    if(home){home.classList.add('v24-home-btn');if(home.parentNode!==top)top.appendChild(home);}
    if(gear){
      gear.classList.add('v24-settings-btn');v24Gear=gear;
      if(home&&home.parentNode===top){if(gear.previousElementSibling!==home)home.insertAdjacentElement('afterend',gear);}
      else if(gear.parentNode!==top)top.appendChild(gear);
      if(!gear.dataset.v24Bound){gear.dataset.v24Bound='1';gear.addEventListener('click',v24GearClicked);}
    }
  }

  function v24Visible(el){
    if(!el||el===document.body||el===document.documentElement)return false;
    const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;
    return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);
  }
  function v24SettingsScore(el){
    if(!v24Visible(el)||el.matches('#cit-clear-confirm,#cit-v18-stats,#v24-settings-fallback'))return -1;
    const txt=((el.id||'')+' '+(typeof el.className==='string'?el.className:'')+' '+(el.getAttribute('aria-label')||'')).toLowerCase();
    let score=0;
    if(/setting|innstill/.test(txt))score+=8;
    if(el.getAttribute('role')==='dialog')score+=4;
    const p=getComputedStyle(el).position;if(p==='fixed'||p==='absolute')score+=2;
    if(el.querySelector('button,input,select'))score+=1;
    return score;
  }
  function v24SettingsTarget(gear){
    if(gear){
      const ids=[gear.getAttribute('aria-controls'),gear.getAttribute('data-target'),gear.getAttribute('data-modal')].filter(Boolean);
      for(let id of ids){id=id.replace(/^#/,'');const el=document.getElementById(id);if(v24Visible(el))return el;}
    }
    const candidates=qa('[id*="setting" i],[class*="setting" i],[id*="innstill" i],[class*="innstill" i],[role="dialog"]')
      .map(el=>({el,score:v24SettingsScore(el)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score);
    return candidates.length&&candidates[0].score>=4?candidates[0].el:null;
  }

  function v24OriginalClear(){return q('#cit-clear');}
  function v24DeleteButton(){
    let b=q('#v24-delete-setting');if(b)return b;
    b=document.createElement('button');b.id='v24-delete-setting';b.type='button';b.className='v24-delete-setting';
    b.innerHTML='<span aria-hidden="true">🗑️</span><span>Slett byen</span>';
    b.setAttribute('aria-label','Slett byen');
    b.addEventListener('click',()=>{const original=v24OriginalClear();if(original)original.click();});
    return b;
  }
  function v24AttachDelete(target){
    if(!target)return false;
    let row=q(':scope > .v24-settings-delete-row',target);
    if(!row){row=document.createElement('div');row.className='v24-settings-delete-row';target.appendChild(row);}
    const b=v24DeleteButton();if(b.parentNode!==row)row.appendChild(b);
    return true;
  }
  function v24Fallback(show){
    const c=city(),top=c&&q('.top-bar',c);if(!top)return;
    let box=q('#v24-settings-fallback');
    if(!box){box=document.createElement('div');box.id='v24-settings-fallback';box.className='v24-settings-fallback';top.appendChild(box);box.appendChild(v24DeleteButton());}
    box.classList.toggle('show',!!show);
  }
  function v24TryAttachDelete(){
    const target=v24SettingsTarget(v24Gear);if(!target)return false;
    v24AttachDelete(target);v24Fallback(false);return true;
  }
  function v24GearClicked(){
    v24Fallback(false);
    let attached=false;
    [0,70,180].forEach((ms,i)=>setTimeout(()=>{
      if(v24TryAttachDelete())attached=true;
      else if(i===2&&!attached)v24Fallback(true);
    },ms));
  }

  function v24TallBusWheels(){
    qa('.v23-stop-svg circle').forEach(c=>{c.classList.add('v24-stop-wheel');c.setAttribute('r','8');});
  }

  function v24Scan(){
    v24ScanQueued=false;
    v24ArrangeNav();
    v24LabelWeek();
    v24TallBusWheels();
    const main=q('#cit-help-main');if(main&&main.textContent.trim()!==V24_MAIN_TEXT)v24RenderHelp();
    if(v24Gear)v24TryAttachDelete();
  }
  function v24QueueScan(){if(v24ScanQueued)return;v24ScanQueued=true;requestAnimationFrame(v24Scan);}

  const c=city();
  if(c){
    const obs=new MutationObserver(v24QueueScan);obs.observe(c,{childList:true,subtree:true,characterData:true});
  }
  const bodyObs=new MutationObserver(()=>{if(v24Gear)v24QueueScan();});bodyObs.observe(document.body,{childList:true,subtree:false});

  v24RenderHelp();v24QueueScan();
})();
