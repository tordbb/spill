(function(){
  'use strict';

  const V18_KEY = 'lekeverksted-new-v18';
  const V18_DEFAULT_NEEDS = [];
  let v18RoundNeeds = new Set();
  let v18FastHome = null;
  let v18FastNext = null;
  let v18Phase = 'build';

  /* Keep /new isolated from the existing game while seeding it from the current save once. */
  try {
    const own = localStorage.getItem(V18_KEY);
    if (own) {
      const parsed = JSON.parse(own);
      if (parsed && typeof parsed === 'object') S = Object.assign({}, S, parsed);
    } else {
      localStorage.setItem(V18_KEY, JSON.stringify(S));
    }
    save = function(){
      try { localStorage.setItem(V18_KEY, JSON.stringify(S)); } catch(e){}
    };
  } catch(e){}

  if (!Array.isArray(S.v18CurrentNeeds)) S.v18CurrentNeeds = V18_DEFAULT_NEEDS.slice();
  if (typeof citLoadSettings === 'function') citLoadSettings();
  if (typeof renderHome === 'function') renderHome();

  function v18CityReady(){ return typeof cit !== 'undefined' && cit && Array.isArray(cit.g); }
  function v18Active(){ return v18CityReady() && typeof citActive === 'function' ? citActive() : new Set(); }
  function v18Reachable(a,b,act){ return typeof citRoute === 'function' && !!citRoute(a,b,act); }

  function v18AssignCount(people, targets, cap, act){
    const slots = targets.map(i=>({i, left:cap}));
    let used = 0;
    for (const p of people) {
      const slot = slots.find(s=>s.left>0 && v18Reachable(p.h,s.i,act));
      if (slot) { slot.left--; used++; }
    }
    return used;
  }

  function v18FarmUsage(act){
    const cap = Number(CITY_CFG.FARM_WORK_CAP)||1;
    const farms = (typeof citFarmCenters === 'function' ? citFarmCenters() : []).filter(i=>citConnected(i,act)).map(i=>({i,left:cap}));
    const farmers = (cit.ppl||[]).filter(p=>p.pref==='M');
    const assigned = new Set();
    let used = 0;
    for (const p of farmers) {
      if (cit.g[p.h] !== 'M') continue;
      const f = farms.find(x=>x.i===p.h && x.left>0);
      if (f) { f.left--; assigned.add(p); used++; }
    }
    for (const p of farmers) {
      if (assigned.has(p)) continue;
      const f = farms.find(x=>x.left>0 && v18Reachable(p.h,x.i,act));
      if (f) { f.left--; assigned.add(p); used++; }
    }
    return {used,total:farms.length*cap,unassigned:farmers.length-used};
  }

  function v18Stats(){
    if (!v18CityReady()) return [];
    const act = v18Active();
    const connectedTiles = t => {
      const a=[]; cit.g.forEach((x,i)=>{if(x===t && citConnected(i,act))a.push(i);}); return a;
    };

    const homeTiles = [];
    cit.g.forEach((t,i)=>{ if ((t==='H'||t==='M') && citConnected(i,act)) homeTiles.push(i); });
    const occupiedHomes = new Set((cit.ppl||[]).map(p=>p.h).filter(i=>homeTiles.includes(i))).size;

    const families=(cit.ppl||[]).filter(p=>p.fam);
    let schoolUsed=0;
    if (typeof citSchoolAssignments === 'function') schoolUsed = citSchoolAssignments(families,act).size;
    const schools=connectedTiles('K');
    const schoolTotal=schools.length*(Number(CITY_CFG.SCHOOL_CAP)||0);

    const offices=connectedTiles('O');
    const officePeople=(cit.ppl||[]).filter(p=>p.pref==='O');
    const officeTotal=offices.length*(Number(CITY_CFG.OFFICE_CAP)||0);
    const officeUsed=v18AssignCount(officePeople,offices,Number(CITY_CFG.OFFICE_CAP)||0,act);

    const shops=[];
    cit.g.forEach((t,i)=>{ if(t==='S' && citConnected(i,act) && (typeof citShopStocked!=='function'||citShopStocked(i))) shops.push(i); });
    const shopPeople=(cit.ppl||[]).filter(p=>p.pref==='S');
    const shopTotal=shops.length*(Number(CITY_CFG.SHOP_WORK_CAP)||0);
    const shopUsed=v18AssignCount(shopPeople,shops,Number(CITY_CFG.SHOP_WORK_CAP)||0,act);

    const farm=v18FarmUsage(act);
    return [
      {icon:'🏠',label:'Boliger',used:occupiedHomes,total:homeTiles.length},
      {icon:'🏫',label:'Skoleplasser',used:schoolUsed,total:schoolTotal},
      {icon:'🏢',label:'Kontorjobber',used:officeUsed,total:officeTotal},
      {icon:'🛍️',label:'Butikkjobber',used:shopUsed,total:shopTotal},
      {icon:'🛖',label:'Gårdsjobber',used:farm.used,total:farm.total}
    ];
  }

  function v18NeedStillPresent(icon){
    if (!v18CityReady()) return false;
    const act=v18Active();
    const ppl=cit.ppl||[];
    if (icon==='🛣️') return ppl.some(p=>!citConnected(p.h,act));
    if (icon==='🏠') {
      const occupied=new Set(ppl.map(p=>p.h));
      let free=0;
      cit.g.forEach((t,i)=>{ if((t==='H'||t==='M') && citConnected(i,act) && !occupied.has(i)) free++; });
      return free===0;
    }
    if (icon==='🏫') {
      const families=ppl.filter(p=>p.fam);
      if (!families.length) return false;
      return typeof citSchoolAssignments==='function' ? citSchoolAssignments(families,act).size<families.length : true;
    }
    if (icon==='🏢') {
      const offices=[];cit.g.forEach((t,i)=>{if(t==='O'&&citConnected(i,act))offices.push(i);});
      const workers=ppl.filter(p=>p.pref==='O');
      return v18AssignCount(workers,offices,Number(CITY_CFG.OFFICE_CAP)||0,act)<workers.length;
    }
    if (icon==='🛍️') {
      const shops=[];cit.g.forEach((t,i)=>{if(t==='S'&&citConnected(i,act)&&(typeof citShopStocked!=='function'||citShopStocked(i)))shops.push(i);});
      const workers=ppl.filter(p=>p.pref==='S');
      return v18AssignCount(workers,shops,Number(CITY_CFG.SHOP_WORK_CAP)||0,act)<workers.length;
    }
    if (icon==='🛖' || icon==='🚜') {
      const farm=v18FarmUsage(act);
      const anyShop=cit.g.some(t=>t==='S');
      let allShopsUnstocked=false;
      if(anyShop && typeof citShopStocked==='function') allShopsUnstocked=!cit.g.some((t,i)=>t==='S'&&citShopStocked(i));
      return farm.unassigned>0 || allShopsUnstocked;
    }
    /* Leisure/play needs do not carry over from older rounds. If they occurred in this round,
       keep them until the player changes the city and runs another day. */
    return true;
  }

  function v18CommitNeeds(){
    const current=[];
    for (const icon of v18RoundNeeds) if (v18NeedStillPresent(icon)) current.push(icon);
    S.v18CurrentNeeds=current;
    save();
    v18RenderHelp();
  }

  function v18NeedIcons(){
    return Array.isArray(S.v18CurrentNeeds) ? [...new Set(S.v18CurrentNeeds)] : [];
  }

  function v18RenderHelp(){
    const main=$('#cit-help-main'), tip=$('#cit-help-tip');
    if(!main||!tip)return;
    main.innerHTML='';
    const icons=v18NeedIcons();
    const wrap=document.createElement('span');wrap.className='v18-needs-icons';
    if(icons.length){
      icons.forEach(icon=>{const s=document.createElement('span');s.className='v18-need-icon';s.textContent=icon;wrap.appendChild(s);});
    } else {
      const ok=document.createElement('span');ok.className='v18-needs-ok';ok.textContent='✓';wrap.appendChild(ok);
    }
    main.appendChild(wrap);
    if(citHelpMode==='undo'){tip.textContent='Tips: Angre med ↶';tip.style.display='';}
    else if(citHelpMode==='road'){tip.textContent='Tips: alt må ha vei for å besøkes';tip.style.display='';}
    else {tip.textContent='';tip.style.display='none';}
  }

  if (typeof citRenderHelp === 'function') citRenderHelp = v18RenderHelp;
  if (typeof citNoteNeed === 'function') {
    const oldNoteNeed=citNoteNeed;
    citNoteNeed=function(icon){
      if(icon)v18RoundNeeds.add(icon);
      oldNoteNeed(icon);
    };
  }

  function v18OpenStats(){
    if(citLock||!v18CityReady())return;
    let ov=$('#cit-v18-stats');
    if(!ov){
      ov=document.createElement('div');ov.id='cit-v18-stats';
      ov.innerHTML='<div class="v18-stats-card"><div class="v18-stats-title">Kapasitet</div><div class="v18-stats-rows"></div><button class="v18-stats-close">✓</button></div>';
      $('#g-cit').appendChild(ov);
      ov.addEventListener('pointerdown',e=>{if(e.target===ov||e.target.classList.contains('v18-stats-close'))ov.classList.remove('show');});
    }
    const rows=ov.querySelector('.v18-stats-rows');rows.innerHTML='';
    for(const s of v18Stats()){
      const row=document.createElement('div');row.className='v18-stat-row';
      const free=Math.max(0,s.total-s.used),pct=s.total?Math.min(100,Math.round(s.used/s.total*100)):0;
      row.innerHTML=`<span class="v18-stat-icon">${s.icon}</span><span class="v18-stat-label">${s.label}</span><span class="v18-stat-num">${s.used}/${s.total}</span><span class="v18-stat-free">${free} ledig</span><span class="v18-stat-bar"><i style="width:${pct}%"></i></span>`;
      rows.appendChild(row);
    }
    ov.classList.add('show');
  }

  function v18InstallStatsButton(){
    let b=$('#cit-pop-wrap');
    if(!b){
      b=document.createElement('button');b.id='cit-pop-wrap';
      const right=$('#cit-right');if(right)right.insertBefore(b,$('#cit-edit-actions'));
    }
    b.classList.add('v18-stats-button');
    b.innerHTML='📊<b id="cit-pop" hidden>0</b>';
    b.setAttribute('aria-label','Statistikk');b.title='Statistikk';
    b.addEventListener('click',v18OpenStats);
  }

  function v18MoveFastIntoTools(){
    const fast=$('#cit-fast'),tools=$('#cit-tools');if(!fast||!tools)return;
    if(!v18FastHome){v18FastHome=fast.parentNode;v18FastNext=fast.nextSibling;}
    fast.textContent='⏩';fast.setAttribute('aria-label','Spol frem');fast.title='Spol frem';
    tools.appendChild(fast);
  }
  function v18RestoreFast(){
    const fast=$('#cit-fast');if(!fast||!v18FastHome)return;
    if(v18FastNext&&v18FastNext.parentNode===v18FastHome)v18FastHome.insertBefore(fast,v18FastNext);else v18FastHome.appendChild(fast);
  }

  function v18SetPhase(phase){
    v18Phase=phase;
    const g=$('#g-cit');if(!g)return;
    g.classList.toggle('v18-dim',phase==='dim');
    g.classList.toggle('v18-sim',phase==='sim');
    g.classList.toggle('v18-build',phase==='build');
    if(phase==='sim')v18MoveFastIntoTools();else v18RestoreFast();
  }

  function v18WatchNightTransition(){
    const fade=$('#cit-fade');
    if(!fade)return null;
    let sawOn=fade.classList.contains('on'),done=false;
    const obs=new MutationObserver(()=>{
      if(fade.classList.contains('on'))sawOn=true;
      else if(sawOn&&!done){done=true;setTimeout(()=>{if(citLock)v18SetPhase('sim');},650);obs.disconnect();}
    });
    obs.observe(fade,{attributes:true,attributeFilter:['class']});
    return obs;
  }

  if (typeof citNight === 'function') {
    const oldNight=citNight;
    citNight=async function(){
      if(citLock)return;
      v18RoundNeeds=new Set();
      v18SetPhase('dim');
      const obs=v18WatchNightTransition();
      const fallback=setTimeout(()=>{if(citLock&&v18Phase==='dim')v18SetPhase('sim');},Math.max(900,(Number(CITY_CFG.NIGHT_FADE_MS)||1100)+850));
      try { await oldNight(); }
      finally {
        clearTimeout(fallback);if(obs)obs.disconnect();
        v18CommitNeeds();
        v18SetPhase('build');
      }
    };
  }

  /* Keep the list current when undo/clear changes the city during the building phase. */
  function v18RefilterSavedNeeds(){
    if(!v18CityReady()||citLock)return;
    S.v18CurrentNeeds=v18NeedIcons().filter(v18NeedStillPresent);save();v18RenderHelp();
  }
  ['cit-undo','cit-clear'].forEach(id=>{const b=$('#'+id);if(b)b.addEventListener('click',()=>setTimeout(v18RefilterSavedNeeds,0));});
  const grid=$('#cit-grid');if(grid)grid.addEventListener('pointerup',()=>setTimeout(v18RefilterSavedNeeds,0));

  v18InstallStatsButton();
  v18SetPhase('build');
  v18RenderHelp();
})();
