(function(){
  'use strict';

  const q=s=>document.querySelector(s);
  const city=()=>q('#g-cit');

  function nativePortrait(){
    const c=city();
    return !!(c && c.classList.contains('v2-portrait') && getComputedStyle(c).transform==='none');
  }

  function rerenderGeometry(){
    try{if(typeof citRenderTiles==='function')citRenderTiles();}catch(_e){}
    try{if(typeof citRenderPeople==='function')citRenderPeople();}catch(_e){}
    try{if(typeof citRenderBusNetwork==='function')citRenderBusNetwork();}catch(_e){}
  }

  /* Rotate logical map coordinates 90deg counterclockwise into a portrait
     footprint without rotating the DOM elements themselves. A 30x20 logical
     city therefore becomes a 20x30 physical footprint while emoji/text stay
     upright. */
  if(typeof citTileXY==='function' && !citTileXY.__v2UprightWrapped){
    const baseTileXY=citTileXY;
    const wrapped=function(i){
      if(nativePortrait()){
        const [r,col]=citRC(i);
        return [r*citTs,(CITY_CFG.COLS-1-col)*citTs];
      }
      return baseTileXY(i);
    };
    wrapped.__v2UprightWrapped=true;
    citTileXY=wrapped;
  }

  /* Native portrait needs a portrait board footprint. The stable fitter assumes
     the whole screen is rotated and subtracts side-panel widths; that produces a
     tiny board once /v2 stops rotating the root. Measure the actual free middle
     region instead and fit ROWS across physical width, COLS across height. */
  if(typeof citFitBoard==='function' && !citFitBoard.__v2UprightWrapped){
    const baseFit=citFitBoard;
    const wrapped=function(){
      const c=city(),v=q('#cit-viewport'),g=q('#cit-grid');
      if(!c||!v||!g||!nativePortrait()){
        const hadNative=!!(c&&c.dataset.v2NativeGeometry==='1');
        if(v&&v.dataset.v2NativeFit==='1'){
          v.style.removeProperty('width');
          v.style.removeProperty('height');
          delete v.dataset.v2NativeFit;
        }
        const out=baseFit.apply(this,arguments);
        if(hadNative&&c){
          delete c.dataset.v2NativeGeometry;
          delete c.dataset.v2NativeRendered;
          rerenderGeometry();
        }
        return out;
      }

      const stage=c.querySelector('.stage-wrap'),help=q('#cit-help'),side=q('#v2-side'),spacer=q('#cit-safe-spacer');
      if(!stage||!help||!side)return baseFit.apply(this,arguments);

      const oldW=v.clientWidth||0,oldH=v.clientHeight||0,oldTs=citTs;
      const focusX=oldW?((oldW/2-citCam.x)/(citCam.scale||1)/oldW):.5;
      const focusY=oldH?((oldH/2-citCam.y)/(citCam.scale||1)/oldH):.5;
      const sr=stage.getBoundingClientRect(),hr=help.getBoundingClientRect(),br=side.getBoundingClientRect();
      const cs=getComputedStyle(stage);
      const padX=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
      const availableW=Math.max(40,sr.width-padX);
      const availableH=Math.max(40,br.top-hr.bottom-8);

      const byW=Math.floor(availableW/CITY_CFG.ROWS);
      const byH=Math.floor(availableH/CITY_CFG.COLS);
      citTs=Math.max(4,Math.min(byW,byH));
      const boardW=CITY_CFG.ROWS*citTs;
      const boardH=CITY_CFG.COLS*citTs;

      c.dataset.v2NativeGeometry='1';
      v.dataset.v2NativeFit='1';
      v.style.setProperty('width',boardW+'px','important');
      v.style.setProperty('height',boardH+'px','important');
      if(spacer)spacer.style.width='0px';

      g.style.width=boardW+'px';
      g.style.height=boardH+'px';
      g.style.backgroundSize=`${citTs}px ${citTs}px, ${citTs}px ${citTs}px, ${citTs}px ${citTs}px`;

      if(oldW&&oldH&&citCam.scale>1){
        citCam.x=boardW/2-focusX*boardW*citCam.scale;
        citCam.y=boardH/2-focusY*boardH*citCam.scale;
      }
      citApplyCamera();

      if(oldTs!==citTs || c.dataset.v2NativeRendered!=='1'){
        c.dataset.v2NativeRendered='1';
        rerenderGeometry();
      }
    };
    wrapped.__v2UprightWrapped=true;
    citFitBoard=wrapped;
  }

  /* The previous /v2 portrait implementation installed a custom horizontal
     gesture that translated into local scrollTop because the root was rotated.
     Native portrait uses a real horizontal tray, so let touch scrolling remain
     native and translate wheel input to scrollLeft. Capture phase keeps the old
     rotated handler from cancelling the native gesture. */
  function installNativeToolScroll(){
    const tools=q('#cit-tools');
    if(!tools||tools.dataset.v2UprightScroll==='1')return;
    tools.dataset.v2UprightScroll='1';
    tools.addEventListener('touchmove',e=>{
      if(nativePortrait())e.stopImmediatePropagation();
    },{capture:true,passive:true});
    tools.addEventListener('wheel',e=>{
      if(!nativePortrait())return;
      const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      if(!delta)return;
      const before=tools.scrollLeft;
      tools.scrollLeft+=delta;
      if(tools.scrollLeft!==before){
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },{capture:true,passive:false});
  }

  installNativeToolScroll();
  requestAnimationFrame(()=>{
    installNativeToolScroll();
    try{if(typeof citFitBoard==='function')citFitBoard();}catch(_e){}
  });
})();
