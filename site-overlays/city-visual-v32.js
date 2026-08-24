(function(){
  'use strict';

  let queued=false;
  let busWrapped=false;

  const q=(s,r=document)=>r&&r.querySelector?r.querySelector(s):null;
  const qa=(s,r=document)=>r&&r.querySelectorAll?[...r.querySelectorAll(s)]:[];
  const city=()=>q('#g-cit');

  function isEditButton(b){
    return !!(b&&(b.id==='cit-undo'||b.classList.contains('v23-undo')||b.classList.contains('v23-broom')||b.hasAttribute('data-v30-fixed-action')));
  }

  function cleanEditActions(){
    const cats=q('#cit-tools .v23-category-col');
    if(!cats)return;
    qa(':scope > .v23-tool-btn',cats).filter(isEditButton).forEach(b=>{
      b.removeAttribute('data-v26-category');
      b.removeAttribute('data-v27-road');
      b.removeAttribute('data-v29-category');
      qa(':scope > .v26-category-svg,:scope > .v27-road-network,:scope > .v29-category-svg',b).forEach(el=>el.remove());
    });
  }

  function syncDayTracker(){
    const source=q('#cit-week'),cell=q('#v31-day-cell');
    if(!source||!cell)return;
    let display=q('#v32-day-display',cell);
    if(!display){
      display=document.createElement('div');
      display.id='v32-day-display';
      display.setAttribute('aria-label','Dager');
      cell.appendChild(display);
    }
    const rows=qa(':scope > .dayrow',source).slice(0,7);
    const signature=rows.map((row,i)=>[
      row.dataset.v24Day||['M','T','O','T','F','L','S'][i],
      row.classList.contains('today')?'1':'0',
      row.classList.contains('v24-saturday')?'1':'0',
      row.classList.contains('v24-sunday')?'1':'0'
    ].join('')).join('|');
    if(display.dataset.v32Signature===signature)return;
    display.dataset.v32Signature=signature;
    display.replaceChildren();
    rows.forEach((row,i)=>{
      const token=document.createElement('span');
      token.className='v32-day-token';
      if(row.classList.contains('today'))token.classList.add('today');
      if(row.classList.contains('v24-saturday'))token.classList.add('saturday');
      if(row.classList.contains('v24-sunday'))token.classList.add('sunday');
      const dot=document.createElement('i');dot.className='v32-day-dot';
      const originalDot=q('.daydot',row);
      if(originalDot){
        const cs=getComputedStyle(originalDot);
        dot.style.backgroundColor=cs.backgroundColor;
      }
      const label=document.createElement('b');
      label.textContent=row.dataset.v24Day||['M','T','O','T','F','L','S'][i];
      token.append(dot,label);
      display.appendChild(token);
    });
  }

  function dedupeSettingsDelete(){
    const settings=q('#cit-settings');
    if(!settings)return;
    const modern=q('#v26-delete-setting',settings);
    if(modern){
      qa('#v24-delete-setting,.v24-settings-delete-row',settings).forEach(el=>{
        const row=el.closest?.('.v24-settings-delete-row');
        (row||el).remove();
      });
    }
  }

  function wrapBusOrientation(){
    if(busWrapped)return;
    busWrapped=true;

    try{
      if(typeof citBusVehicleEl==='function'&&!citBusVehicleEl.__v32Rotation){
        const baseVehicle=citBusVehicleEl;
        const wrapped=function(){
          const v=baseVehicle.apply(this,arguments);
          if(v&&v.body)v.body.style.transform='rotate(-90deg)';
          return v;
        };
        wrapped.__v32Rotation=true;
        citBusVehicleEl=wrapped;
      }
    }catch(_e){}

    try{
      if(typeof citBusOrient==='function'&&!citBusOrient.__v32Rotation){
        const baseOrient=citBusOrient;
        const wrapped=function(v){
          const r=baseOrient.apply(this,arguments);
          if(v&&v.body){
            const own=(v.body.style.transform||'').replace(/^rotate\(-90deg\)\s*/,'');
            v.body.style.transform='rotate(-90deg)'+(own?' '+own:'');
          }
          return r;
        };
        wrapped.__v32Rotation=true;
        citBusOrient=wrapped;
      }
    }catch(_e){}
  }

  function scan(){
    queued=false;
    const c=city();if(!c)return;
    c.classList.add('v32-rotation-clean');
    cleanEditActions();
    syncDayTracker();
    dedupeSettingsDelete();
    wrapBusOrientation();
  }

  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(scan);
  }

  wrapBusOrientation();
  const c=city();
  if(c){
    const obs=new MutationObserver(queue);
    obs.observe(c,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
  queue();
})();