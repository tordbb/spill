const { test, expect } = require('@playwright/test');

const ROOT='http://127.0.0.1:4173/';
const V2=ROOT+'v2/';

async function openCity(page,width,height){
  await page.setViewportSize({width,height});
  await page.goto(V2);
  await page.click('#card-cit');
  await expect(page.locator('#g-cit')).toHaveClass(/active/);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-city-layout/);
  await page.waitForTimeout(220);
}

async function rect(locator){
  const b=await locator.boundingBox();
  expect(b).not.toBeNull();
  return {...b,right:b.x+b.width,bottom:b.y+b.height,cx:b.x+b.width/2,cy:b.y+b.height/2};
}

test('portrait top groups, vertical week, settings clear, minimum board and default zoom are correct', async ({page})=>{
  const width=390,height=760;
  await openCity(page,width,height);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-portrait/);

  const left=page.locator('#v2-top-left');
  const center=page.locator('#v2-top-center');
  const right=page.locator('#v2-top-right');
  for(const l of [left,center,right])await expect(l).toBeVisible();
  await expect(left.locator('.nav-home')).toHaveCount(1);
  await expect(center.locator('#cit-hud')).toHaveCount(1);
  await expect(center.locator('#cit-week')).toHaveCount(1);
  await expect(right.locator('#cit-pop-wrap')).toHaveCount(1);
  await expect(right.locator('#cit-settings-btn')).toHaveCount(1);

  const lb=await rect(left),cb=await rect(center),rb=await rect(right);
  expect(lb.x).toBeLessThan(cb.x);
  expect(cb.right).toBeLessThan(rb.right);
  expect(Math.abs(cb.cx-width/2)).toBeLessThan(48);
  expect(lb.x).toBeLessThan(12);
  expect(rb.right).toBeGreaterThan(width-12);

  const names=await page.locator('#cit-week .dayname').allTextContents();
  expect(names).toEqual(['mandag','tirsdag','onsdag','torsdag','fredag','lørdag','søndag']);
  const dayBoxes=[];
  for(let i=0;i<7;i++)dayBoxes.push(await rect(page.locator('#cit-week .dayrow').nth(i)));
  for(let i=1;i<dayBoxes.length;i++)expect(dayBoxes[i].y).toBeGreaterThan(dayBoxes[i-1].y);
  const todayIndex=await page.locator('#cit-week .dayrow').evaluateAll(rows=>rows.findIndex(r=>r.classList.contains('today')));
  expect(todayIndex).toBe(await page.evaluate(()=>citDayOfWeek()));

  await expect(page.locator('#cit-edit-actions')).toBeHidden();
  await expect(page.locator('#cit-clear')).toBeHidden();
  const quick=await rect(page.locator('#v2-quick-actions'));
  const moon=await rect(page.locator('#cit-night'));
  expect(moon.height).toBeGreaterThan(quick.height*0.78);

  const cam=await page.evaluate(()=>({scale:citCam.scale,x:citCam.x,y:citCam.y}));
  expect(cam.scale).toBeGreaterThan(1.65);
  expect(cam.scale).toBeLessThan(1.95);
  expect(Math.abs(cam.x)).toBeLessThan(1);
  expect(Math.abs(cam.y)).toBeLessThan(1);

  const viewport=await rect(page.locator('#cit-viewport'));
  const zoomedGrid=await rect(page.locator('#cit-grid'));
  expect(Math.abs(zoomedGrid.x-viewport.x)).toBeLessThan(2);
  expect(Math.abs(zoomedGrid.y-viewport.y)).toBeLessThan(2);
  expect(zoomedGrid.width).toBeGreaterThan(viewport.width*1.65);
  expect(zoomedGrid.height).toBeGreaterThan(viewport.height*1.65);
  const bg=await page.locator('#cit-grid').evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(bg).toContain('radial-gradient');

  await page.evaluate(()=>{citCam.scale=1;citCam.x=0;citCam.y=0;citApplyCamera();});
  const fullGrid=await rect(page.locator('#cit-grid'));
  const fullViewport=await rect(page.locator('#cit-viewport'));
  expect(Math.abs(fullGrid.x-fullViewport.x)).toBeLessThan(2);
  expect(Math.abs(fullGrid.y-fullViewport.y)).toBeLessThan(2);
  expect(Math.abs(fullGrid.width-fullViewport.width)).toBeLessThan(2);
  expect(Math.abs(fullGrid.height-fullViewport.height)).toBeLessThan(2);

  await page.click('#cit-settings-btn');
  await expect(page.locator('#cit-settings')).toHaveClass(/show/);
  await expect(page.locator('#v2-clear-setting #cit-clear')).toBeVisible();
  await expect(page.locator('#cit-size-options .cit-size-btn')).toHaveCount(2);
  await expect(page.locator('#cit-size-options .cit-size-btn[data-size="S"]')).toHaveCount(0);
  expect(await page.locator('#cit-size-options .cit-size-btn').allTextContents()).toEqual(['20×30','40×60']);
});

test('legacy 15x10 saves migrate to the 20x30 minimum board without green padding', async ({page})=>{
  await page.addInitScript(()=>{
    const city={money:100,day:7,cols:15,rows:10,g:Array(150).fill(0),ppl:[],st:{},shopStock:{},farmDelivery:{},busLines:[],ns:1,arr:0,personSeq:0,stockModelVersion:2};
    localStorage.setItem('lekeverksted',JSON.stringify({citySettings:{size:'S'},city,done:{},stickers:[],muted:false}));
  });
  await openCity(page,390,760);
  const state=await page.evaluate(()=>({cols:CITY_CFG.COLS,rows:CITY_CFG.ROWS,len:cit.g.length,size:S.citySettings.size,small:CITY_SIZES.S||null}));
  expect(state).toEqual({cols:30,rows:20,len:600,size:'M',small:null});

  await page.evaluate(()=>{citCam.scale=1;citCam.x=0;citCam.y=0;citApplyCamera();});
  const v=await rect(page.locator('#cit-viewport'));
  const g=await rect(page.locator('#cit-grid'));
  expect(Math.abs(v.width-g.width)).toBeLessThan(2);
  expect(Math.abs(v.height-g.height)).toBeLessThan(2);
  expect(await page.locator('#cit-grid').evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('radial-gradient');
});

test('portrait selected bus route uses the same physical coordinates as its stops', async ({page})=>{
  await openCity(page,390,760);
  const setup=await page.evaluate(()=>{
    const cols=CITY_CFG.COLS;
    cit.g=Array(CITY_CFG.COLS*CITY_CFG.ROWS).fill(0);
    const road=[];
    for(let c=23;c<=28;c++){const i=2*cols+c;cit.g[i]='R';road.push(i);}
    cit.busLines=[{id:1,stops:[road[0],road[road.length-1]]}];
    citBusSelectedLine=1;citTool='BUS';citInvalidateBusCache();
    citRenderTiles();citRenderHelp();
    return {first:road[0],last:road[road.length-1]};
  });
  await page.waitForTimeout(100);

  const result=await page.evaluate(({first,last})=>{
    const g=document.querySelector('#cit-grid');
    const svg=g.querySelector('.cit-bus-route-layer');
    const poly=svg&&svg.querySelector('polyline');
    if(!svg||!poly)return null;
    const vb=svg.viewBox.baseVal;
    const matrix=svg.getScreenCTM();
    const screenPoint=(pt)=>{
      const p=svg.createSVGPoint();p.x=pt.x;p.y=pt.y;
      const s=p.matrixTransform(matrix);return {x:s.x,y:s.y};
    };
    const pts=poly.points;
    const ends=[screenPoint(pts.getItem(0)),screenPoint(pts.getItem(pts.numberOfItems-1))];
    const stopCenters=[first,last].map(i=>{
      const r=g.querySelector(`.cit-bus-stop[data-i="${i}"]`).getBoundingClientRect();
      return {x:r.left+r.width/2,y:r.top+r.height/2};
    });
    const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    return {
      viewBox:{w:vb.width,h:vb.height},
      grid:{w:g.clientWidth,h:g.clientHeight},
      endDistances:ends.map(e=>Math.min(...stopCenters.map(s=>dist(e,s))))
    };
  },setup);
  expect(result).not.toBeNull();
  expect(Math.abs(result.viewBox.w-result.grid.w)).toBeLessThan(0.5);
  expect(Math.abs(result.viewBox.h-result.grid.h)).toBeLessThan(0.5);
  for(const d of result.endDistances)expect(d).toBeLessThan(3);
});

test('housing stats count every dwelling and report true vacancies', async ({page})=>{
  await openCity(page,390,760);
  await page.evaluate(()=>{
    const n=CITY_CFG.COLS*CITY_CFG.ROWS;
    cit.g=Array(n).fill(0);
    const homes=[citIdx(2,2),citIdx(8,18),citIdx(15,27)];
    homes.forEach(i=>cit.g[i]='H');
    cit.ppl=[{h:homes[0],pref:'O',fam:false}];
    citRenderTiles();citHud();
  });
  await page.click('#cit-pop-wrap');
  await expect(page.locator('#cit-v18-stats')).toHaveClass(/show/);
  const row=page.locator('.v18-stat-row').filter({hasText:'Boliger'});
  await expect(row).toContainText('1/3');
  await expect(row).toContainText('2 ledig');
});

test('landscape hides trash, enlarges moon and keeps destructive clear inside settings', async ({page})=>{
  await openCity(page,844,350);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-landscape/);
  await expect(page.locator('#cit-edit-actions')).toBeHidden();
  await expect(page.locator('#cit-clear')).toBeHidden();
  const moon=await rect(page.locator('#cit-night'));
  expect(moon.height).toBeGreaterThan(76);

  const nav=page.locator('#v2-nav > button');
  await expect(nav).toHaveCount(2);
  await nav.nth(1).click();
  await expect(page.locator('#cit-settings')).toHaveClass(/show/);
  await expect(page.locator('#v2-clear-setting #cit-clear')).toBeVisible();
  await expect(page.locator('#cit-size-options .cit-size-btn')).toHaveCount(2);
});
