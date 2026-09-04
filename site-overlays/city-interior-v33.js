(function(){
  'use strict';

  const ROOT_ID='cit-interior-v33';
  const STORAGE_VERSION=1;
  const DOUBLE_MS=390;
  const WALL_TOP=9, WALL_BOTTOM=43;
  const FLOOR_TOP=48, FLOOR_BOTTOM=89;
  let currentIndex=null;
  let currentType=null;
  let currentRoom=null;
  let selectedId=null;
  let activeTab='furniture';
  let drag=null;
  let idSeq=1;
  let lastTap={i:null,t:0,x:0,y:0};

  const CATALOG={
    H:{
      title:'Stue', icon:'🏠',
      furniture:[
        {type:'sofa',label:'Sofa',glyph:'🛋️',zone:'floor',scale:1.25},
        {type:'chair',label:'Stol',glyph:'🪑',zone:'floor',scale:1.05},
        {type:'table',label:'Bord',glyph:'▰',zone:'floor',scale:1.05,support:true},
        {type:'bed',label:'Seng',glyph:'🛏️',zone:'floor',scale:1.2},
        {type:'cabinet',label:'Skap',glyph:'🗄️',zone:'floor',scale:1.05,support:true},
        {type:'shelf',label:'Hylle',glyph:'▤',zone:'wall',scale:1.05,support:true}
      ],
      objects:[
        {type:'window',label:'Vindu',glyph:'🪟',zone:'wall',scale:1.1},
        {type:'lamp',label:'Lampe',glyph:'💡',zone:'floor'},
        {type:'rug',label:'Teppe',glyph:'▱',zone:'floor',scale:1.35},
        {type:'plant',label:'Plante',glyph:'🪴',zone:'floor'},
        {type:'pillow',label:'Pute',glyph:'🟨',zone:'floor',placeable:true},
        {type:'books',label:'Bøker',glyph:'📚',zone:'floor',placeable:true},
        {type:'picture',label:'Bilde',glyph:'🖼️',zone:'wall'},
        {type:'clock',label:'Klokke',glyph:'🕰️',zone:'wall'},
        {type:'vase',label:'Vase',glyph:'🏺',zone:'floor',placeable:true},
        {type:'bowl',label:'Skål',glyph:'🥣',zone:'floor',placeable:true},
        {type:'food',label:'Mat',glyph:'🍎',zone:'floor',placeable:true},
        {type:'toy',label:'Leke',glyph:'🧸',zone:'floor',placeable:true},
        {type:'computer',label:'PC',glyph:'💻',zone:'floor',placeable:true},
        {type:'candle',label:'Lys',glyph:'🕯️',zone:'floor',placeable:true}
      ]
    },
    S:{
      title:'Butikk', icon:'🛍️',
      furniture:[
        {type:'counter',label:'Disk',glyph:'▰',zone:'floor',scale:1.15,support:true},
        {type:'display',label:'Varebord',glyph:'▱',zone:'floor',scale:1.15,support:true},
        {type:'fridge',label:'Kjøler',glyph:'🧊',zone:'floor',scale:1.15,support:true},
        {type:'checkout',label:'Kasse',glyph:'🧾',zone:'floor',scale:1.05,support:true},
        {type:'rack',label:'Stativ',glyph:'♜',zone:'floor',scale:1.1,support:true},
        {type:'shelf',label:'Hylle',glyph:'▤',zone:'wall',scale:1.05,support:true}
      ],
      objects:[
        {type:'window',label:'Vindu',glyph:'🪟',zone:'wall',scale:1.1},
        {type:'bread',label:'Brød',glyph:'🥖',zone:'floor',placeable:true},
        {type:'fruit',label:'Frukt',glyph:'🍎',zone:'floor',placeable:true},
        {type:'veg',label:'Grønt',glyph:'🥕',zone:'floor',placeable:true},
        {type:'drink',label:'Drikke',glyph:'🧃',zone:'floor',placeable:true},
        {type:'milk',label:'Melk',glyph:'🥛',zone:'floor',placeable:true},
        {type:'cheese',label:'Ost',glyph:'🧀',zone:'floor',placeable:true},
        {type:'cans',label:'Bokser',glyph:'🥫',zone:'floor',placeable:true},
        {type:'cereal',label:'Frokost',glyph:'📦',zone:'floor',placeable:true},
        {type:'toys',label:'Leker',glyph:'🧸',zone:'floor',placeable:true},
        {type:'clothes',label:'Klær',glyph:'👕',zone:'floor',placeable:true},
        {type:'shoes',label:'Sko',glyph:'👟',zone:'floor',placeable:true},
        {type:'flowers',label:'Blomster',glyph:'💐',zone:'floor',placeable:true},
        {type:'boxes',label:'Eske',glyph:'📦',zone:'floor',placeable:true}
      ]
    }
  };

  function cityReady(){ return typeof cit!=='undefined' && cit && Array.isArray(cit.g); }
  function buildPhase(){
    const game=document.getElementById('g-cit');
    return !!(game && game.classList.contains('active') && game.classList.contains('v18-build') && !citLock);
  }
  function ensureState(){
    if(!cityReady())return null;
    if(!cit.interiors || typeof cit.interiors!=='object' || Array.isArray(cit.interiors))cit.interiors={};
    if(!cit.interiorVersion)cit.interiorVersion=STORAGE_VERSION;
    return cit.interiors;
  }
  function cleanState(){
    const rooms=ensureState(); if(!rooms)return;
    let changed=false;
    Object.keys(rooms).forEach(k=>{
      const i=Number(k),room=rooms[k],t=cit.g[i];
      if((t!=='H'&&t!=='S') || !room || room.buildingType!==t){ delete rooms[k]; changed=true; }
    });
    if(changed && typeof save==='function')save();
  }
  function roomFor(i,t){
    const rooms=ensureState();
    let room=rooms[String(i)];
    if(!room || room.buildingType!==t){
      room={buildingType:t,items:[],updatedAt:Date.now()};
      rooms[String(i)]=room;
      save();
    }
    if(!Array.isArray(room.items))room.items=[];
    return room;
  }
  function definition(type,kind){
    const cat=CATALOG[currentType]; if(!cat)return null;
    const list=kind==='furniture'?cat.furniture:cat.objects;
    return list.find(x=>x.type===type)||null;
  }
  function definitionForItem(item){ return definition(item.type,item.kind); }
  function nextId(){ return 'ci'+Date.now().toString(36)+(idSeq++).toString(36); }
  function clamp(n,a,b){ return Math.max(a,Math.min(b,n)); }

  function installUi(){
    if(document.getElementById(ROOT_ID))return;
    const root=document.createElement('div');
    root.id=ROOT_ID;
    root.setAttribute('aria-hidden','true');
    root.innerHTML=`
      <div class="ci-scene">
        <div class="ci-room-bg">
          <div class="ci-back-wall"></div>
          <div class="ci-side-wall ci-left-wall"></div>
          <div class="ci-side-wall ci-right-wall"></div>
          <div class="ci-floor"></div>
          <div class="ci-baseboard"></div>
        </div>
        <div class="ci-room-title" id="ci-room-title"></div>
        <button class="ci-exit" id="ci-exit" aria-label="Forlat bygningen">← <span>Byen</span></button>
        <div class="ci-canvas" id="ci-canvas" aria-label="Innredning"></div>
        <aside class="ci-palette" aria-label="Innredningsmeny">
          <div class="ci-tabs">
            <button class="ci-tab active" data-tab="furniture" aria-label="Møbler">🛋️<span>Møbler</span></button>
            <button class="ci-tab" data-tab="objects" aria-label="Ting">📦<span>Ting</span></button>
          </div>
          <div class="ci-palette-items" id="ci-palette-items"></div>
        </aside>
        <button class="ci-delete" id="ci-delete" aria-label="Fjern valgt objekt" disabled>🗑️</button>
        <div class="ci-wall-note" id="ci-wall-note">Vindu og hylle må stå på veggen</div>
      </div>`;
    document.getElementById('g-cit').appendChild(root);
    root.querySelector('#ci-exit').addEventListener('click',closeInterior);
    root.querySelector('#ci-delete').addEventListener('click',removeSelected);
    root.querySelectorAll('.ci-tab').forEach(b=>b.addEventListener('click',()=>{
      activeTab=b.dataset.tab;
      root.querySelectorAll('.ci-tab').forEach(x=>x.classList.toggle('active',x===b));
      renderPalette();
    }));
    root.querySelector('#ci-canvas').addEventListener('pointerdown',beginDrag,{passive:false});
    root.querySelector('#ci-canvas').addEventListener('pointermove',moveDrag,{passive:false});
    root.querySelector('#ci-canvas').addEventListener('pointerup',endDrag,{passive:false});
    root.querySelector('#ci-canvas').addEventListener('pointercancel',cancelDrag,{passive:false});
  }

  function renderPalette(){
    const box=document.getElementById('ci-palette-items'); if(!box||!currentType)return;
    box.innerHTML='';
    const list=CATALOG[currentType][activeTab];
    list.forEach(def=>{
      const b=document.createElement('button');
      b.className='ci-choice'; b.dataset.type=def.type; b.dataset.kind=activeTab;
      b.innerHTML=`<span class="ci-choice-glyph">${def.glyph}</span><span class="ci-choice-label">${def.label}</span>`;
      if(def.zone==='wall')b.classList.add('wall-only');
      b.addEventListener('click',()=>addItem(def,activeTab));
      box.appendChild(b);
    });
  }

  function initialPosition(def,kind){
    const count=currentRoom.items.length;
    if(def.zone==='wall')return {x:47+(count%4)*7,y:22+(count%2)*7};
    return {x:48+(count%5)*6,y:67+(count%3)*7};
  }
  function addItem(def,kind){
    if(!currentRoom)return;
    const p=initialPosition(def,kind);
    const item={id:nextId(),type:def.type,kind,x:p.x,y:p.y,zone:def.zone||'floor',on:null};
    currentRoom.items.push(item); selectedId=item.id;
    persistRoom(); renderItems(); updateSelection();
    const el=document.querySelector(`.ci-item[data-id="${item.id}"]`); if(el){el.classList.add('ci-pop');setTimeout(()=>el.classList.remove('ci-pop'),240);}
  }

  function renderItems(){
    const canvas=document.getElementById('ci-canvas'); if(!canvas||!currentRoom)return;
    canvas.innerHTML='';
    const ordered=currentRoom.items.slice().sort((a,b)=>{
      const da=definitionForItem(a),db=definitionForItem(b);
      const za=da&&da.zone==='wall'?0:1,zb=db&&db.zone==='wall'?0:1;
      return za-zb || a.y-b.y;
    });
    ordered.forEach(item=>{
      const def=definitionForItem(item); if(!def)return;
      const el=document.createElement('div');
      el.className='ci-item ci-'+item.kind+' ci-type-'+item.type;
      if(def.zone==='wall')el.classList.add('ci-wall-item');
      if(def.support)el.classList.add('ci-support');
      if(item.on)el.classList.add('ci-on-furniture');
      if(item.id===selectedId)el.classList.add('selected');
      el.dataset.id=item.id;
      el.style.left=item.x+'%'; el.style.top=item.y+'%'; el.style.setProperty('--ci-scale',def.scale||1);
      el.innerHTML=`<span class="ci-item-glyph">${def.glyph}</span>`;
      el.setAttribute('role','button');el.setAttribute('aria-label',def.label);
      canvas.appendChild(el);
    });
  }
  function updateSelection(){
    const del=document.getElementById('ci-delete'); if(del)del.disabled=!selectedId;
    document.querySelectorAll('#ci-canvas .ci-item').forEach(el=>el.classList.toggle('selected',el.dataset.id===selectedId));
  }
  function persistRoom(){
    if(!currentRoom)return;
    currentRoom.updatedAt=Date.now();
    ensureState()[String(currentIndex)]=currentRoom;
    if(typeof save==='function')save();
  }

  function canvasPoint(e){
    const c=document.getElementById('ci-canvas'),r=c.getBoundingClientRect();
    return {x:(e.clientX-r.left)/Math.max(1,r.width)*100,y:(e.clientY-r.top)/Math.max(1,r.height)*100};
  }
  function itemById(id){ return currentRoom&&currentRoom.items.find(x=>x.id===id); }
  function constrain(item,p){
    const def=definitionForItem(item)||{};
    if(def.zone==='wall')return {x:clamp(p.x,17,90),y:clamp(p.y,WALL_TOP,WALL_BOTTOM)};
    return {x:clamp(p.x,14,92),y:clamp(p.y,FLOOR_TOP,FLOOR_BOTTOM)};
  }
  function beginDrag(e){
    const el=e.target.closest('.ci-item');
    if(!el||!currentRoom)return;
    e.preventDefault();e.stopPropagation();
    const item=itemById(el.dataset.id);if(!item)return;
    selectedId=item.id;updateSelection();
    const p=canvasPoint(e);
    drag={pointerId:e.pointerId,item,startX:item.x,startY:item.y,lastX:item.x,lastY:item.y,offsetX:item.x-p.x,offsetY:item.y-p.y,childStarts:{}};
    currentRoom.items.filter(x=>x.on===item.id).forEach(ch=>{drag.childStarts[ch.id]={x:ch.x,y:ch.y};});
    try{el.setPointerCapture(e.pointerId);}catch(_){}
    el.classList.add('dragging');
  }
  function moveDrag(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.preventDefault();
    const p=canvasPoint(e),q=constrain(drag.item,{x:p.x+drag.offsetX,y:p.y+drag.offsetY});
    const dx=q.x-drag.startX,dy=q.y-drag.startY;
    drag.item.x=q.x;drag.item.y=q.y;drag.lastX=q.x;drag.lastY=q.y;
    Object.entries(drag.childStarts).forEach(([id,s])=>{
      const child=itemById(id);if(!child)return;
      const cq=constrain(child,{x:s.x+dx,y:s.y+dy}); child.x=cq.x;child.y=cq.y;
    });
    renderItems();updateSelection();
    const el=document.querySelector(`.ci-item[data-id="${drag.item.id}"]`);if(el)el.classList.add('dragging');
  }
  function endDrag(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    e.preventDefault();
    const item=drag.item; drag=null;
    maybeSnapToSupport(item);persistRoom();renderItems();updateSelection();
  }
  function cancelDrag(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    const d=drag;drag=null;d.item.x=d.startX;d.item.y=d.startY;
    Object.entries(d.childStarts).forEach(([id,s])=>{const child=itemById(id);if(child){child.x=s.x;child.y=s.y;}});
    renderItems();updateSelection();
  }
  function maybeSnapToSupport(item){
    const def=definitionForItem(item);if(!def||item.kind!=='objects'||!def.placeable){item.on=null;return;}
    let best=null,bestD=Infinity;
    currentRoom.items.forEach(s=>{
      if(s.id===item.id)return;const sd=definitionForItem(s);if(!sd||!sd.support)return;
      const dx=item.x-s.x,dy=item.y-s.y,d=Math.hypot(dx,dy*1.2);
      if(d<11&&d<bestD){best=s;bestD=d;}
    });
    if(!best){item.on=null;return;}
    item.on=best.id;
    const sd=definitionForItem(best);
    item.x=clamp(best.x+((currentRoom.items.indexOf(item)%3)-1)*2.8,15,91);
    item.y=sd&&sd.zone==='wall'?clamp(best.y-3.8,WALL_TOP,WALL_BOTTOM):clamp(best.y-6.2,FLOOR_TOP,FLOOR_BOTTOM);
  }
  function removeSelected(){
    if(!currentRoom||!selectedId)return;
    const id=selectedId;
    currentRoom.items=currentRoom.items.filter(x=>x.id!==id);
    currentRoom.items.forEach(x=>{if(x.on===id)x.on=null;});
    selectedId=null;persistRoom();renderItems();updateSelection();
  }

  function openInterior(i,tile){
    if(!buildPhase()||!cityReady())return false;
    const t=cit.g[i];if(t!=='H'&&t!=='S')return false;
    installUi();cleanState();
    currentIndex=i;currentType=t;currentRoom=roomFor(i,t);selectedId=null;activeTab='furniture';
    const root=document.getElementById(ROOT_ID),game=document.getElementById('g-cit');
    const tr=tile&&tile.getBoundingClientRect?tile.getBoundingClientRect():null,gr=game.getBoundingClientRect();
    if(tr&&gr.width&&gr.height){
      root.style.setProperty('--ci-origin-x',clamp((tr.left+tr.width/2-gr.left)/gr.width*100,0,100)+'%');
      root.style.setProperty('--ci-origin-y',clamp((tr.top+tr.height/2-gr.top)/gr.height*100,0,100)+'%');
    }else{root.style.setProperty('--ci-origin-x','50%');root.style.setProperty('--ci-origin-y','50%');}
    game.classList.add('cit-interior-open');
    root.classList.remove('closing');root.classList.add('show');root.setAttribute('aria-hidden','false');
    const title=document.getElementById('ci-room-title');title.textContent=CATALOG[t].icon+' '+CATALOG[t].title;
    root.classList.toggle('shop-room',t==='S');root.classList.toggle('house-room',t==='H');
    root.querySelectorAll('.ci-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
    renderPalette();renderItems();updateSelection();
    requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('opened')));
    return true;
  }
  function closeInterior(){
    const root=document.getElementById(ROOT_ID),game=document.getElementById('g-cit');if(!root||!root.classList.contains('show'))return;
    persistRoom();root.classList.remove('opened');root.classList.add('closing');
    setTimeout(()=>{
      root.classList.remove('show','closing');root.setAttribute('aria-hidden','true');game.classList.remove('cit-interior-open');
      currentIndex=null;currentType=null;currentRoom=null;selectedId=null;drag=null;
    },180);
  }

  function cellFromPointer(e){
    const v=document.getElementById('cit-viewport');if(!v)return null;
    const r=v.getBoundingClientRect();
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(document.getElementById('g-cit')).transform!=='none';
    const local=rotated?{x:e.clientY-r.top,y:r.right-e.clientX}:{x:e.clientX-r.left,y:e.clientY-r.top};
    const worldX=(local.x-citCam.x)/citCam.scale,worldY=(local.y-citCam.y)/citCam.scale;
    const c=Math.floor(worldX/citTs),rr=Math.floor(worldY/citTs);
    if(rr<0||c<0||rr>=CITY_CFG.ROWS||c>=CITY_CFG.COLS)return null;
    return rr*CITY_CFG.COLS+c;
  }
  function installBuildingOpenGesture(){
    const viewport=document.getElementById('cit-viewport');if(!viewport)return;
    viewport.addEventListener('pointerdown',e=>{
      if(!buildPhase()||!cityReady())return;
      if(e.pointerType==='mouse'&&e.button!==0)return;
      const i=cellFromPointer(e);if(i==null)return;
      const t=cit.g[i];if(t!=='H'&&t!=='S')return;
      const now=performance.now(),dx=e.clientX-lastTap.x,dy=e.clientY-lastTap.y;
      if(lastTap.i===i && now-lastTap.t<=DOUBLE_MS && Math.hypot(dx,dy)<34){
        lastTap={i:null,t:0,x:0,y:0};
        e.preventDefault();e.stopImmediatePropagation();
        const tile=document.querySelector(`#cit-grid .ct[data-i=\"${i}\"]`);
        openInterior(i,tile);
      }else lastTap={i,t:now,x:e.clientX,y:e.clientY};
    },true);
    viewport.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
  }

  function wrapCityMutations(){
    if(typeof citBulldoze==='function'){
      const oldBulldoze=citBulldoze;
      citBulldoze=function(i){
        const t=cityReady()?cit.g[i]:null,rooms=ensureState();
        const changed=oldBulldoze(i);
        if(changed && rooms && (t==='H'||t==='S') && rooms[String(i)]){delete rooms[String(i)];save();}
        return changed;
      };
    }
    if(typeof citResizeState==='function'){
      const oldResize=citResizeState;
      citResizeState=function(newCols,newRows){
        if(!cityReady())return oldResize(newCols,newRows);
        const oldDims=typeof citInferDims==='function'?citInferDims(cit):[CITY_CFG.COLS,CITY_CFG.ROWS];
        const oldCols=oldDims[0],oldRooms=JSON.parse(JSON.stringify(ensureState()||{}));
        const out=oldResize(newCols,newRows);
        const mapped={};
        Object.entries(oldRooms).forEach(([k,room])=>{
          const oi=Number(k),r=Math.floor(oi/oldCols),c=oi%oldCols;
          if(r>=newRows||c>=newCols)return;
          const ni=r*newCols+c,t=cit.g[ni];
          if(room&&room.buildingType===t&&(t==='H'||t==='S'))mapped[String(ni)]=room;
        });
        cit.interiors=mapped;save();return out;
      };
    }
    if(typeof citRestore==='function'){
      const oldRestore=citRestore;
      citRestore=function(state){const out=oldRestore(state);cleanState();return out;};
    }
  }

  function installCloseGuards(){
    const night=document.getElementById('cit-night');
    if(night)night.addEventListener('click',()=>{if(document.getElementById(ROOT_ID)?.classList.contains('show'))closeInterior();},true);
    document.querySelectorAll('#g-cit .nav-home').forEach(b=>b.addEventListener('click',closeInterior,true));
  }

  installUi();
  installBuildingOpenGesture();
  wrapCityMutations();
  installCloseGuards();
  cleanState();

  window.__citInteriorV33={open:openInterior,close:closeInterior,catalog:CATALOG};
})();
