(() => {
  'use strict';

  const COLS = 10;
  const ROWS = 20;
  const CELL = 30;
  const EMPTY = null;
  const COLORS = ['#ff6b8a','#ffb347','#ffe169','#72d6a8','#63b9ff','#a98bff'];
  const SHAPES = {
    I:[[0,1],[1,1],[2,1],[3,1]],
    J:[[0,0],[0,1],[1,1],[2,1]],
    L:[[2,0],[0,1],[1,1],[2,1]],
    O:[[0,0],[1,0],[0,1],[1,1]],
    S:[[1,0],[2,0],[0,1],[1,1]],
    T:[[1,0],[0,1],[1,1],[2,1]],
    Z:[[0,0],[1,0],[1,1],[2,1]]
  };
  const TYPES = Object.keys(SHAPES);
  const STORAGE_KEY = 'spill-kakefall-best-v1';

  const boardCanvas = document.getElementById('board');
  const ctx = boardCanvas.getContext('2d');
  const nextCanvas = document.getElementById('next');
  const nextCtx = nextCanvas.getContext('2d');
  const holdCanvas = document.getElementById('hold');
  const holdCtx = holdCanvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const statusEl = document.getElementById('status');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const overlayButton = document.getElementById('overlay-button');
  const pauseButton = document.getElementById('pause');

  let board;
  let active;
  let queue;
  let bag;
  let holdPiece;
  let canHold;
  let score;
  let lines;
  let level;
  let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let running;
  let gameOver;
  let lastTime = 0;
  let dropAccumulator = 0;
  let messageTimer = 0;
  let pointerStart = null;

  function emptyBoard(){ return Array.from({length:ROWS},()=>Array(COLS).fill(EMPTY)); }

  function refillBag(){
    bag = TYPES.slice();
    for(let i=bag.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [bag[i],bag[j]]=[bag[j],bag[i]];
    }
  }

  function randomColorSet(count){
    const anchor = Math.floor(Math.random()*COLORS.length);
    return Array.from({length:count},(_,i)=>{
      if(i===0 || Math.random()<0.55) return anchor;
      const offset=1+Math.floor(Math.random()*(COLORS.length-1));
      return (anchor+offset)%COLORS.length;
    });
  }

  function makePiece(type){
    const cells=SHAPES[type].map(([x,y])=>({x,y}));
    return {type,cells,colors:randomColorSet(cells.length),x:3,y:-1,rotation:0};
  }

  function takeFromBag(){
    if(!bag || !bag.length) refillBag();
    return makePiece(bag.pop());
  }

  function ensureQueue(){ while(queue.length<4) queue.push(takeFromBag()); }

  function cloneForPreview(piece){
    return piece ? {type:piece.type,cells:piece.cells.map(c=>({...c})),colors:piece.colors.slice(),x:0,y:0,rotation:piece.rotation} : null;
  }

  function spawn(){
    ensureQueue();
    active=queue.shift();
    ensureQueue();
    active.x=3;
    active.y=-1;
    canHold=true;
    if(collides(active,0,0)) endGame();
    drawPreviews();
  }

  function collides(piece,dx,dy,cellsOverride){
    const cells=cellsOverride || piece.cells;
    for(const c of cells){
      const x=piece.x+c.x+dx;
      const y=piece.y+c.y+dy;
      if(x<0 || x>=COLS || y>=ROWS) return true;
      if(y>=0 && board[y][x]) return true;
    }
    return false;
  }

  function rotatedCells(piece,dir=1){
    if(piece.type==='O') return piece.cells.map(c=>({...c}));
    const rotated=piece.cells.map(({x,y})=> dir>0 ? ({x:3-y,y:x}) : ({x:y,y:3-x}));
    let minX=Math.min(...rotated.map(c=>c.x));
    let minY=Math.min(...rotated.map(c=>c.y));
    return rotated.map(c=>({x:c.x-minX,y:c.y-minY}));
  }

  function rotate(){
    if(!running || gameOver || !active) return;
    const cells=rotatedCells(active,1);
    for(const kick of [0,-1,1,-2,2]){
      if(!collides(active,kick,0,cells)){
        active.x+=kick;
        active.cells=cells;
        active.rotation=(active.rotation+1)%4;
        draw();
        return;
      }
    }
  }

  function move(dx){
    if(!running || gameOver || !active) return false;
    if(!collides(active,dx,0)){
      active.x+=dx;
      draw();
      return true;
    }
    return false;
  }

  function softDrop(manual=false){
    if(!running || gameOver || !active) return false;
    if(!collides(active,0,1)){
      active.y++;
      if(manual){ score+=1; updateStats(); }
      draw();
      return true;
    }
    lockPiece();
    return false;
  }

  function hardDrop(){
    if(!running || gameOver || !active) return;
    let cells=0;
    while(!collides(active,0,1)){ active.y++; cells++; }
    score+=cells*2;
    lockPiece();
  }

  function hold(){
    if(!running || gameOver || !active || !canHold) return;
    const current=cloneForPreview(active);
    current.x=3; current.y=-1;
    if(holdPiece){
      const swap=holdPiece;
      holdPiece=current;
      active=swap;
      active.x=3; active.y=-1;
      if(collides(active,0,0)){ endGame(); return; }
    }else{
      holdPiece=current;
      spawn();
    }
    canHold=false;
    drawPreviews();
    draw();
  }

  function lockPiece(){
    for(let i=0;i<active.cells.length;i++){
      const c=active.cells[i];
      const x=active.x+c.x;
      const y=active.y+c.y;
      if(y<0){ endGame(); return; }
      board[y][x]={color:active.colors[i],type:active.type};
    }
    resolveBoard();
    if(!gameOver) spawn();
    updateStats();
    draw();
  }

  function clearFullRows(){
    const full=[];
    for(let y=0;y<ROWS;y++) if(board[y].every(Boolean)) full.push(y);
    if(!full.length) return 0;
    for(const y of full){ board.splice(y,1); board.unshift(Array(COLS).fill(EMPTY)); }
    const count=full.length;
    lines+=count;
    const table=[0,120,320,560,900];
    score+=(table[count] || count*280)*level;
    flash(`${count===1?'Rad':'Rader'} ryddet: +${(table[count] || count*280)*level}`);
    return count;
  }

  function findColorClusters(){
    const seen=Array.from({length:ROWS},()=>Array(COLS).fill(false));
    const clusters=[];
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
      if(seen[y][x] || !board[y][x]) continue;
      const color=board[y][x].color;
      const q=[[x,y]];
      const group=[];
      seen[y][x]=true;
      while(q.length){
        const [cx,cy]=q.pop();
        group.push([cx,cy]);
        for(const [nx,ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]){
          if(nx<0||nx>=COLS||ny<0||ny>=ROWS||seen[ny][nx]||!board[ny][nx]||board[ny][nx].color!==color) continue;
          seen[ny][nx]=true;
          q.push([nx,ny]);
        }
      }
      if(group.length>=4) clusters.push(group);
    }
    return clusters;
  }

  function collapseColumns(){
    for(let x=0;x<COLS;x++){
      const stack=[];
      for(let y=ROWS-1;y>=0;y--) if(board[y][x]) stack.push(board[y][x]);
      for(let y=ROWS-1,i=0;y>=0;y--,i++) board[y][x]=i<stack.length?stack[i]:EMPTY;
    }
  }

  function clearColorClusters(multiplier){
    const clusters=findColorClusters();
    if(!clusters.length) return 0;
    let removed=0;
    for(const group of clusters){
      for(const [x,y] of group){
        if(board[y][x]){ board[y][x]=EMPTY; removed++; }
      }
    }
    collapseColumns();
    const gained=removed*35*level*multiplier;
    score+=gained;
    flash(`Kakebonus x${multiplier}: ${removed} biter, +${gained}`);
    return removed;
  }

  function resolveBoard(){
    let chain=1;
    let guard=0;
    while(guard++<8){
      const rows=clearFullRows();
      const colors=clearColorClusters(chain);
      if(!rows && !colors) break;
      chain++;
    }
    level=1+Math.floor(lines/10);
  }

  function gravityMs(){ return Math.max(90,780*Math.pow(0.84,level-1)); }

  function endGame(){
    gameOver=true;
    running=false;
    if(score>best){ best=score; localStorage.setItem(STORAGE_KEY,String(best)); }
    updateStats();
    overlayTitle.textContent='Kaken er full!';
    overlayText.textContent=`Du fikk ${score.toLocaleString('nb-NO')} poeng og ryddet ${lines} ${lines===1?'rad':'rader'}.`;
    overlayButton.textContent='Spill igjen';
    overlay.hidden=false;
    pauseButton.textContent='▶';
  }

  function togglePause(force){
    if(gameOver) return;
    running=typeof force==='boolean'?force:!running;
    overlay.hidden=running;
    pauseButton.textContent=running?'⏸':'▶';
    if(!running){
      overlayTitle.textContent='Pause';
      overlayText.textContent='Spillet er satt på pause.';
      overlayButton.textContent='Fortsett';
    }else{
      lastTime=performance.now();
      dropAccumulator=0;
    }
  }

  function restart(){
    board=emptyBoard(); queue=[]; bag=[]; holdPiece=null; canHold=true;
    score=0; lines=0; level=1; gameOver=false; running=true; dropAccumulator=0;
    overlay.hidden=true; pauseButton.textContent='⏸';
    spawn(); updateStats(); draw();
    flash('Fyll en rad eller koble fire like farger.');
    lastTime=performance.now();
  }

  function updateStats(){
    if(score>best){ best=score; localStorage.setItem(STORAGE_KEY,String(best)); }
    scoreEl.textContent=score.toLocaleString('nb-NO');
    bestEl.textContent=best.toLocaleString('nb-NO');
    levelEl.textContent=level;
    linesEl.textContent=lines;
  }

  function flash(text){
    statusEl.textContent=text;
    messageTimer=performance.now()+2600;
  }

  function roundedRect(context,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    context.beginPath();
    context.roundRect(x,y,w,h,rr);
  }

  function drawCakeCell(context,x,y,size,colorIndex,alpha=1){
    const color=COLORS[colorIndex];
    const pad=Math.max(1.5,size*.055);
    const px=x+pad, py=y+pad, s=size-pad*2;
    context.save(); context.globalAlpha=alpha;
    context.shadowColor='#0007'; context.shadowBlur=size*.12; context.shadowOffsetY=size*.06;
    roundedRect(context,px,py,s,s,size*.16); context.fillStyle='#c88955'; context.fill();
    context.shadowColor='transparent';
    roundedRect(context,px,py,s,s*.72,size*.16); context.fillStyle=color; context.fill();
    context.fillStyle='#ffffff50'; roundedRect(context,px+s*.12,py+s*.10,s*.52,s*.13,s*.07); context.fill();
    context.fillStyle='#ffffff2e'; context.beginPath(); context.arc(px+s*.76,py+s*.24,s*.07,0,Math.PI*2); context.fill();
    context.restore();
  }

  function ghostY(){
    let dy=0;
    while(!collides(active,0,dy+1)) dy++;
    return active.y+dy;
  }

  function drawBoardBackground(){
    ctx.clearRect(0,0,boardCanvas.width,boardCanvas.height);
    const grad=ctx.createLinearGradient(0,0,0,boardCanvas.height);
    grad.addColorStop(0,'#1c1023'); grad.addColorStop(1,'#0d0912');
    ctx.fillStyle=grad; ctx.fillRect(0,0,boardCanvas.width,boardCanvas.height);
    ctx.strokeStyle='#ffffff0c'; ctx.lineWidth=1;
    for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL+.5,0);ctx.lineTo(x*CELL+.5,ROWS*CELL);ctx.stroke();}
    for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL+.5);ctx.lineTo(COLS*CELL,y*CELL+.5);ctx.stroke();}
  }

  function draw(){
    drawBoardBackground();
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(board[y][x]) drawCakeCell(ctx,x*CELL,y*CELL,CELL,board[y][x].color);
    if(active && !gameOver){
      const gy=ghostY();
      for(let i=0;i<active.cells.length;i++){
        const c=active.cells[i];
        if(gy+c.y>=0) drawCakeCell(ctx,(active.x+c.x)*CELL,(gy+c.y)*CELL,CELL,active.colors[i],.20);
      }
      for(let i=0;i<active.cells.length;i++){
        const c=active.cells[i]; const y=active.y+c.y;
        if(y>=0) drawCakeCell(ctx,(active.x+c.x)*CELL,y*CELL,CELL,active.colors[i]);
      }
    }
  }

  function drawPreview(context,canvas,piece){
    context.clearRect(0,0,canvas.width,canvas.height);
    if(!piece) return;
    const cells=piece.cells;
    const maxX=Math.max(...cells.map(c=>c.x)); const maxY=Math.max(...cells.map(c=>c.y));
    const w=maxX+1,h=maxY+1;
    const s=Math.min(canvas.width/(w+1.2),canvas.height/(h+1.0),34);
    const ox=(canvas.width-w*s)/2, oy=(canvas.height-h*s)/2;
    for(let i=0;i<cells.length;i++) drawCakeCell(context,ox+cells[i].x*s,oy+cells[i].y*s,s,piece.colors[i]);
  }

  function drawPreviews(){
    drawPreview(nextCtx,nextCanvas,queue[0]);
    drawPreview(holdCtx,holdCanvas,holdPiece);
  }

  function frame(now){
    if(messageTimer && now>messageTimer){ statusEl.textContent='Koble minst fire like farger for bonus.'; messageTimer=0; }
    if(running && !gameOver){
      const dt=Math.min(100,now-lastTime || 0); dropAccumulator+=dt;
      if(dropAccumulator>=gravityMs()){ dropAccumulator=0; softDrop(false); }
    }
    lastTime=now;
    requestAnimationFrame(frame);
  }

  function bindRepeat(button,fn){
    let timer=null;
    const clear=()=>{ if(timer){ clearInterval(timer); timer=null; } };
    button.addEventListener('pointerdown',e=>{e.preventDefault();fn();clear();timer=setInterval(fn,110);});
    button.addEventListener('pointerup',clear); button.addEventListener('pointercancel',clear); button.addEventListener('pointerleave',clear);
  }

  bindRepeat(document.getElementById('left'),()=>move(-1));
  bindRepeat(document.getElementById('right'),()=>move(1));
  document.getElementById('rotate').addEventListener('click',rotate);
  document.getElementById('drop').addEventListener('click',hardDrop);
  document.getElementById('hold-btn').addEventListener('click',hold);
  pauseButton.addEventListener('click',()=>togglePause());
  overlayButton.addEventListener('click',()=> gameOver ? restart() : togglePause(true));

  window.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' ','c','C','p','P'].includes(e.key)) e.preventDefault();
    if(e.key==='ArrowLeft') move(-1);
    else if(e.key==='ArrowRight') move(1);
    else if(e.key==='ArrowDown') softDrop(true);
    else if(e.key==='ArrowUp') rotate();
    else if(e.key===' ') hardDrop();
    else if(e.key==='c'||e.key==='C') hold();
    else if(e.key==='p'||e.key==='P') togglePause();
  },{passive:false});

  boardCanvas.addEventListener('pointerdown',e=>{
    pointerStart={x:e.clientX,y:e.clientY,time:performance.now()};
    boardCanvas.setPointerCapture?.(e.pointerId);
  });
  boardCanvas.addEventListener('pointerup',e=>{
    if(!pointerStart || !running){pointerStart=null;return;}
    const dx=e.clientX-pointerStart.x, dy=e.clientY-pointerStart.y;
    const adx=Math.abs(dx), ady=Math.abs(dy);
    if(Math.max(adx,ady)<18) rotate();
    else if(adx>ady){
      const steps=Math.min(4,Math.max(1,Math.round(adx/34)));
      for(let i=0;i<steps;i++) move(dx>0?1:-1);
    }else if(dy>30) hardDrop();
    pointerStart=null;
  });
  boardCanvas.addEventListener('pointercancel',()=>{pointerStart=null;});
  document.addEventListener('visibilitychange',()=>{ if(document.hidden && running && !gameOver) togglePause(false); });

  bestEl.textContent=best.toLocaleString('nb-NO');
  restart();
  requestAnimationFrame(frame);
})();
