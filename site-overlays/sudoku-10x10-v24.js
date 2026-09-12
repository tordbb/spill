(function(){
  'use strict';

  const TEN_PALETTES=[
    ['#8f6ad8','#f5cf2f','#a8e58c','#e97ade','#5dc0e5','#c94f88','#ff9d76','#6fc7a5','#f2a7c2','#8ba7e8'],
    ['#65c6b5','#ffd166','#8bcf72','#ef8eb8','#7aa5e6','#b56bd8','#ff9f80','#70c7a5','#f4c95d','#83c5e8'],
    ['#ffad77','#80cbc4','#b39ddb','#f7d36d','#81d4fa','#e78ac3','#9ccc65','#ffcc80','#90caf9','#ce93d8'],
    ['#9ccc65','#ffcc80','#90caf9','#ce93d8','#ef9a9a','#80cbc4','#ffd166','#8f6ad8','#5dc0e5','#f2a7c2']
  ];

  const TEN_LEVELS=[
    {regions:['BBBBFFFDAA','BBBFFFFDDA','CCFFFFDDDA','CEEEFDDDII','CEFFFFDDDI','CEFFFFFGGI','CEHHFFGGGI','CHHHFFFGJI','CHHFFFFFJI','CHHHFFFJJI'],solution:[8,2,0,5,1,4,6,3,9,7],grade:1,size:10,animal:'🐧'},
    {regions:['CCGGGGGAAA','DCCCGGAABB','DDCCCGAABB','DFGGGGGEEE','DFGGGGEEEE','DFFGGGEHEE','FFIGGGGHEE','JFIGGGGHHH','JJIIGGGHHH','JJJGGGGGHH'],solution:[7,9,4,0,6,2,5,8,3,1],grade:1,size:10,animal:'🐨'},
    {regions:['AAAAAABBBB','AAAABBBCBB','AAAAAACCCB','AADAAACECC','AFDAAAEECI','AFFGAAHEEI','AAFGGAHHHI','AAFFGHHJHI','AAFFGGJJII','AAFFGGGJJJ'],solution:[0,4,8,2,6,1,3,5,9,7],grade:1,size:10,animal:'🦝'},
    {regions:['BBAAACCCCC','BBDECCCCCC','DBDEEECGGG','DDDDDECGGG','FFFGEEGGGG','GFGGGGGGGG','GGGGGGGGGG','HHHGIIIGGG','HHHIIIIIGJ','HHHIJJJJJJ'],solution:[4,0,6,3,5,1,8,2,7,9],grade:1,size:10,animal:'🐼'},
    {regions:['AAAAAABBBJ','DDCAABBBBJ','DDCCCBEEEJ','DDDGCCEEEJ','DIGGGCFJEJ','IIIIGGFJJJ','IIIIGFFJJJ','IIFFFFHHJJ','IJJJJJJJJJ','JJJJJJJJJJ'],solution:[2,5,3,1,8,6,4,7,0,9],grade:1,size:10,animal:'🐰'},
    {regions:['CCCAAAFFFF','CCCABBAGGF','CCCAAAAAGF','CECCDDGAGF','EECDDDGGGF','HHHIIIGGFF','IHHIIIIGII','IHIIIIIIII','IIIIIIIIII','IIIIIJJIII'],solution:[3,5,2,4,0,9,7,1,8,6],grade:1,size:10,animal:'🐸'},
    {regions:['HCCAAAAABB','HECCCAGBBB','HEECCAGGGD','HEEECAGDDD','HEJECCGFFF','HHJECGGJJF','HHJJGGJJJJ','HHJIIJJJJJ','JJJJIJJJJJ','JJJJJJJJJJ'],solution:[6,8,3,7,1,9,5,0,4,2],grade:1,size:10,animal:'🦊'},
    {regions:['CCBBBBBAAA','CCBBBBBADA','CCCBBBDADA','CCBBBBDDDD','ECBBBBDFDD','ECBBBBBFGG','ECCBBBBGGG','EIIHHBGGGG','EIJJHBGGGG','IIJJHBGGGG'],solution:[8,5,2,6,0,7,9,4,1,3],grade:1,size:10,animal:'🐵'},
    {regions:['AAAACCBBBB','AACCCCEDDB','FCCEEEEDDD','FFJEEEDDDD','FFJJJEEGGG','FFJJJJJGGG','HJJJJJJJGG','HJJJJJJIII','JJJJJJIIII','JJJJJJJIII'],solution:[3,9,2,7,5,1,8,0,6,4],grade:1,size:10,animal:'🐧'},
    {regions:['AAAADDCBBB','AAADDCCBBB','AAADCCCCBB','AEADDGGGGG','EEEEEGGGGG','EEEEFFGGGG','EEEGFGGGGG','HEGGGGGGGG','HIIGJJJGGG','HHJJJJJGGG'],solution:[3,9,7,4,1,5,8,0,2,6],grade:2,size:10,animal:'🐨'},
    {regions:['AAAAAAAAAA','ADDAAAAABB','DDCCAAAABB','DCCAAAAABE','DFCCAAAEEE','FFFAAAAAGE','FFFFAAAAGE','JIIIHHHHGG','JJJIIIHHGG','JJIIHHHHGG'],solution:[5,9,3,0,7,2,8,6,4,1],grade:2,size:10,animal:'🦝'},
    {regions:['BBAAAAAFFF','BBADDADFCC','BAAEDDDFCF','BEEEEGDFFF','HEEGEGDFFF','HHHGGGFFFJ','HHJJGJJJJJ','HJJJJJJJJJ','HHJJJIIJJJ','JJJJJJJJJJ'],solution:[3,1,8,6,2,7,4,0,5,9],grade:2,size:10,animal:'🐼'},
    {regions:['BBBBEEEEAC','BBBBBEAAAC','BBBEEEEECC','EEEEEDDDCD','EEEEEEEDDD','EFFEEEDDDD','EIIEEEGGGG','EIIHEEGGGG','IIIHEEGGGG','IJJJEEGGGG'],solution:[8,4,9,7,5,1,6,3,0,2],grade:2,size:10,animal:'🐰'},
    {regions:['AAABBBBBBB','ACBBBBBBBB','ACCBBBBBBB','CCDDBBBBBE','CDDBBBBBBE','CCDFBFFEEE','DDDFFFGGEE','IIHHHHGGEE','IHHHJJGJEE','IIIIJJJJEE'],solution:[2,8,1,3,9,5,7,4,0,6],grade:2,size:10,animal:'🐸'},
    {regions:['BBBBCAAAFF','EBBBCAAAFF','EBCCCAAAFF','ECCDDDDDFF','EECDGGGDDF','JEEEGJGGFF','JJJJJJJGJJ','JHHJJJJGJJ','JHIIJJJJJJ','JJJJJJJJJJ'],solution:[5,2,4,6,0,9,7,1,3,8],grade:3,size:10,animal:'🦊'},
    {regions:['AAABBBBBBB','AAEBBCBBBB','AEEBBCBBBB','EECCCCDDBB','EEFFCCBBBB','EEFFFFBBBB','GJJJFFBBBB','GGJIFFBBBH','GGJIIIIHHH','GGJJIIHHHH'],solution:[2,8,5,7,1,4,0,9,6,3],grade:3,size:10,animal:'🐵'},
    {regions:['AAAACCCBBB','AHAAAACCCB','AHEEECCCBB','HHEIIIDDDD','HHEIIIIDFF','HHEIIIFDFF','HHGGIIFFFJ','HIIIIIIIJJ','IIIIIIIIIJ','IIIIIIIIJJ'],solution:[1,9,5,7,2,6,3,0,4,8],grade:3,size:10,animal:'🐧'},
    {regions:['CCCCCCCCCA','BCCCCCCCCA','BCCCCCCCCC','DDCCCCCCCG','DDDDCCEEEG','DFFEEEEEEG','DFFFIEGGGG','FFFFIIGHHH','IIFIIIJJJH','IIIIJJJHHH'],solution:[9,0,4,1,7,2,6,8,3,5],grade:3,size:10,animal:'🐨'},
    {regions:['EEEEEAABBB','EEEEECAFBB','GEGEECDFFF','GGGECCDDFF','GGGEHDDDFF','GGHHHHHHFH','GGHHHHHHHH','GIHHHHHHHH','JIIIHHHHHH','JJJIHHHHHH'],solution:[6,9,5,7,3,8,1,4,2,0],grade:3,size:10,animal:'🦝'},
    {regions:['CCCCCAAAAA','CBBCCCAAAA','CCCCCCCDAA','EAAAAAADAA','EAAAAAAAAA','EEEAFGAAAA','EEIFFGGGGA','JEIFFGHHGG','JJIIIIHHHG','JJJHHHHHHG'],solution:[9,2,5,7,0,4,8,6,3,1],grade:3,size:10,animal:'🐼'}
  ].map((lv,i)=>Object.assign(lv,{palette:TEN_PALETTES[i%TEN_PALETTES.length]}));

  if(typeof SDK_LEVELS==='undefined'||!Array.isArray(SDK_LEVELS))return;
  if(!SDK_LEVELS.some(lv=>lv&&lv.size===10))SDK_LEVELS.push(...TEN_LEVELS);
  if(typeof GAMES!=='undefined'&&GAMES.sdk)GAMES.sdk.n=SDK_LEVELS.length;

  const style=document.createElement('style');
  style.id='sudoku-10x10-v24-style';
  style.textContent='\n#sdk-dots.sdk-level-nav{display:flex;align-items:center;justify-content:center;gap:3px;flex-wrap:nowrap;max-width:none;margin:0 auto;min-height:34px}\n#sdk-dots.sdk-level-nav button{width:27px;height:27px;min-width:27px;border:0;border-radius:10px;padding:0;background:#ffffffaa;color:#38536b;font-size:12px;font-weight:850;box-shadow:0 2px 0 #00000015;cursor:pointer}\n#sdk-dots.sdk-level-nav button.sdk-level-current{width:48px;min-width:48px;background:#fff;color:#174f78;outline:3px solid #42a5f5;font-size:11px}\n#sdk-dots.sdk-level-nav button.sdk-level-done{background:#ffe082;color:#594600}\n#sdk-dots.sdk-level-nav button.sdk-level-locked{opacity:.32;cursor:default}\n#sdk-dots.sdk-level-nav button.sdk-level-arrow{font-size:19px;background:#ffffffcc;color:#31566f}\n#sdk-dots.sdk-level-nav button:disabled{opacity:.28;cursor:default}\n#sdk-board.sdk-board-dynamic{display:grid!important;width:min(88vw,calc(100vh - 160px),560px)!important;height:auto!important;aspect-ratio:1/1;gap:0!important;overflow:hidden;border-radius:18px;box-shadow:0 6px 0 #00000018;flex:0 1 auto}\n#sdk-board.sdk-board-dynamic .sdk-cell{position:relative!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border-radius:0!important;line-height:1;cursor:pointer}\n#sdk-board.sdk-size-10 .sdk-cell{font-size:clamp(15px,4.3vmin,25px)!important}\n#sdk-board.sdk-size-10 .sdk-x{font-size:1.15em!important}\n#sdk-board.sdk-size-10 .sdk-animal{font-size:1.05em!important}\n#sdk-board.sdk-size-6 .sdk-cell{font-size:clamp(24px,7vmin,42px)!important}\n@media (max-width:420px){#sdk-dots.sdk-level-nav{gap:2px}#sdk-dots.sdk-level-nav button{width:25px;height:25px;min-width:25px}#sdk-dots.sdk-level-nav button.sdk-level-current{width:46px;min-width:46px}}\n@media (max-height:430px){#sdk-board.sdk-board-dynamic{width:min(72vw,calc(100vh - 145px),430px)!important}}\n';
  document.head.appendChild(style);

  function sdkN(lv){return lv&&Array.isArray(lv.solution)?lv.solution.length:6;}
  function sdkPaintCell(cell,lv,r,c,n){
    const letter=lv.regions[r][c],idx=letter.charCodeAt(0)-65,pal=lv.palette||TEN_PALETTES[0];
    cell.style.background=pal[idx%pal.length];
    const outer='3px solid #fff',inner='1px solid #ffffff55';
    cell.style.borderTop=(r===0||lv.regions[r-1][c]!==letter)?outer:inner;
    cell.style.borderBottom=(r===n-1||lv.regions[r+1][c]!==letter)?outer:inner;
    cell.style.borderLeft=(c===0||lv.regions[r][c-1]!==letter)?outer:inner;
    cell.style.borderRight=(c===n-1||lv.regions[r][c+1]!==letter)?outer:inner;
  }
  function sdkRenderLevelSelector(){
    const el=document.querySelector('#sdk-dots');if(!el)return;el.innerHTML='';el.className='dots sdk-level-nav';
    const total=SDK_LEVELS.length,done=Math.max(0,Number(S&&S.done&&S.done.sdk||0)),radius=innerWidth<=420?1:2;
    const add=(txt,cls,idx,disabled)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.className=cls||'';b.disabled=!!disabled;if(idx!=null)b.setAttribute('aria-label','Nivå '+(idx+1)+' av '+total);if(idx!=null&&!disabled)b.addEventListener('click',()=>{if(idx<=done&&idx!==sdkCur)openSdk(idx);});el.appendChild(b);return b;};
    add('‹','sdk-level-arrow',sdkCur-1,sdkCur<=0);
    const start=Math.max(0,sdkCur-radius),end=Math.min(total-1,sdkCur+radius);
    for(let i=start;i<=end;i++){let cls=i===sdkCur?'sdk-level-current':(i<done?'sdk-level-done':'');if(i>done)cls+=' sdk-level-locked';const label=i===sdkCur?((i+1)+'/'+total):String(i+1);add(label,cls.trim(),i,i>done);}
    add('›','sdk-level-arrow',sdkCur+1,sdkCur>=total-1||sdkCur+1>done);
  }

  if(typeof sdkAllCorrectXsMarked==='function')sdkAllCorrectXsMarked=function(){const lv=SDK_LEVELS[sdkCur],n=sdkN(lv);for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(lv.solution[r]!==c&&!sdkX.has(sdkKey(r,c)))return false;return true;};
  if(typeof sdkNextHintX==='function')sdkNextHintX=function(){const lv=SDK_LEVELS[sdkCur],n=sdkN(lv);for(let r=0;r<n;r++)for(let c=0;c<n;c++){const k=sdkKey(r,c);if(lv.solution[r]!==c&&!sdkX.has(k)&&!sdkFound.has(k))return[r,c];}return null;};
  if(typeof sdkCellClick==='function')sdkCellClick=function(r,c,el){sdkClearHint();const k=sdkKey(r,c),lv=SDK_LEVELS[sdkCur],n=sdkN(lv);if(sdkFound.has(k))return;if(sdkMode==='x'){if(sdkX.has(k))sdkX.delete(k);else sdkX.add(k);sfx('click');sdkRender();return;}if(!sdkIsSolution(r,c)){el.classList.remove('sdk-wrong');void el.offsetWidth;el.classList.add('sdk-wrong');sfx('hmm');return;}sdkX.delete(k);sdkFound.add(k);sfx('snap');sdkRender();if(sdkFound.size===n)setTimeout(()=>award('sdk',sdkCur,()=>{if(sdkCur+1<SDK_LEVELS.length)openSdk(sdkCur+1);else goHome();}),420);};
  if(typeof sdkRender==='function')sdkRender=function(){
    sdkClearHint();sdkRenderLevelSelector();const lv=SDK_LEVELS[sdkCur],n=sdkN(lv),board=document.querySelector('#sdk-board');board.innerHTML='';board.classList.add('sdk-board-dynamic');board.classList.toggle('sdk-size-10',n===10);board.classList.toggle('sdk-size-6',n===6);board.style.gridTemplateColumns='repeat('+n+',minmax(0,1fr))';board.style.gridTemplateRows='repeat('+n+',minmax(0,1fr))';document.querySelector('#sdk-count-animal').textContent=lv.animal;document.querySelector('#sdk-found-count').textContent=sdkFound.size+' / '+n;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){const b=document.createElement('button');b.type='button';b.className='sdk-cell';b.dataset.r=r;b.dataset.c=c;b.setAttribute('aria-label','Rad '+(r+1)+', kolonne '+(c+1));sdkPaintCell(b,lv,r,c,n);const k=sdkKey(r,c);if(sdkFound.has(k)){const a=document.createElement('span');a.className='sdk-animal';a.textContent=lv.animal;b.appendChild(a);}else if(sdkX.has(k)){const x=document.createElement('span');x.className='sdk-x';x.textContent='×';b.appendChild(x);}b.addEventListener('click',()=>sdkCellClick(r,c,b));board.appendChild(b);}sdkRenderModes();
  };
  const screen=document.querySelector('#g-sdk');if(screen&&screen.classList.contains('active'))sdkRender();
})();
