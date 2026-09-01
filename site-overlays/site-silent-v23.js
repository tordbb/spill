(function(){
  'use strict';

  const noop=function(){};

  try{
    if(typeof S!=='undefined'&&S){
      S.muted=true;
      if(typeof save==='function')save();
    }
  }catch(e){}

  try{if(typeof AC!=='undefined'&&AC&&AC.state!=='closed'&&typeof AC.suspend==='function')AC.suspend();}catch(e){}

  try{if(typeof ac==='function')ac=function(){return null;};}catch(e){}
  try{if(typeof tone==='function')tone=noop;}catch(e){}
  try{if(typeof slide==='function')slide=noop;}catch(e){}
  try{if(typeof sfx==='function')sfx=noop;}catch(e){}

  const mute=document.querySelector('#btn-mute');
  if(mute){
    mute.textContent='🔇';
    mute.disabled=true;
    mute.setAttribute('aria-label','Lyd er slått av');
    mute.title='Lyd er slått av';
  }

  document.querySelectorAll('audio,video').forEach(media=>{
    try{media.muted=true;media.volume=0;}catch(e){}
  });
})();
