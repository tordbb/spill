const { test, expect } = require('@playwright/test');

const ROOT='http://127.0.0.1:4173/';
const V2=ROOT+'v2/';

const box=async locator=>{
  const b=await locator.boundingBox();
  expect(b).not.toBeNull();
  return {...b,right:b.x+b.width,bottom:b.y+b.height,cx:b.x+b.width/2,cy:b.y+b.height/2};
};

async function openCity(page,width,height){
  await page.setViewportSize({width,height});
  await page.goto(V2);
  await page.click('#card-cit');
  await expect(page.locator('#g-cit')).toHaveClass(/active/);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-city-layout/);
  await page.waitForTimeout(160);
}

async function expectInsideViewport(page,locator,width,height){
  await expect(locator).toBeVisible();
  const b=await box(locator);
  const meta=await locator.evaluate(el=>({
    tag:el.tagName.toLowerCase(),
    id:el.id||'',
    cls:typeof el.className==='string'?el.className:'',
    text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,60),
    aria:el.getAttribute('aria-label')||''
  }));
  const note=`${meta.tag}#${meta.id}.${meta.cls} text="${meta.text}" aria="${meta.aria}" rect=${JSON.stringify(b)}`;
  expect(b.x,note).toBeGreaterThanOrEqual(-1);
  expect(b.y,note).toBeGreaterThanOrEqual(-1);
  expect(b.right,note).toBeLessThanOrEqual(width+1);
  expect(b.bottom,note).toBeLessThanOrEqual(height+1);
  return b;
}

test('/v2 home replicates the stable root and Cave Flight stays inside /v2', async ({ page }) => {
  await page.setViewportSize({width:900,height:600});
  await page.goto(ROOT);
  const stableCards=await page.locator('#home .menu-card').evaluateAll(nodes=>nodes.map(n=>n.id));
  expect(stableCards.length).toBeGreaterThan(5);

  await page.goto(V2);
  const v2Cards=await page.locator('#home .menu-card').evaluateAll(nodes=>nodes.map(n=>n.id));
  expect(v2Cards).toEqual(stableCards);

  await page.click('#card-cave');
  await expect(page).toHaveURL(/\/v2\/cave\/?$/);
  await expect(page.locator('#cave-home')).toHaveAttribute('href','../');
  await page.click('#cave-home');
  await expect(page).toHaveURL(/\/v2\/?$/);
});

test('landscape uses visual viewport: nav row, scrollable tool column, maximised map, visible status', async ({ page }) => {
  const width=844,height=350;
  await openCity(page,width,height);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-landscape/);

  const city=await expectInsideViewport(page,page.locator('#g-cit'),width,height);
  expect(Math.abs(city.width-width)).toBeLessThan(2);
  expect(Math.abs(city.height-height)).toBeLessThan(2);

  const side=await expectInsideViewport(page,page.locator('#v2-side'),width,height);
  const nav=await expectInsideViewport(page,page.locator('#v2-nav'),width,height);
  const tools=await expectInsideViewport(page,page.locator('#v2-tool-zone'),width,height);
  const map=await expectInsideViewport(page,page.locator('#cit-viewport'),width,height);
  const status=await expectInsideViewport(page,page.locator('#cit-right'),width,height);

  expect(side.height).toBeGreaterThan(height*0.9);
  expect(nav.y).toBeLessThan(tools.y);
  expect(nav.bottom).toBeLessThanOrEqual(tools.y+2);
  expect(tools.height).toBeGreaterThan(side.height*0.68);
  expect(side.right).toBeLessThanOrEqual(map.x+8);
  expect(map.right).toBeLessThanOrEqual(status.x+8);
  expect(map.width).toBeGreaterThan(width*0.45);

  const navButtons=page.locator('#v2-nav > button');
  await expect(navButtons).toHaveCount(2);
  const home=await box(navButtons.nth(0));
  const settings=await box(navButtons.nth(1));
  expect(Math.abs(home.y-settings.y)).toBeLessThan(5);
  expect(home.x).toBeLessThan(settings.x);

  await expectInsideViewport(page,page.locator('#cit-night'),width,height);
  await expectInsideViewport(page,page.locator('#cit-week'),width,height);
  await expectInsideViewport(page,page.locator('#cit-pop-wrap'),width,height);

  const toolScroll=await page.locator('#cit-tools').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));
  expect(['auto','scroll']).toContain(toolScroll.overflow);

  await navButtons.nth(0).click();
  await expect(page.locator('#home')).toHaveClass(/active/);
});

test('portrait is one 90deg counterclockwise city with actions bottom and info/navigation top', async ({ page }) => {
  const width=390,height=760;
  await openCity(page,width,height);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-portrait/);

  const matrix=await page.locator('#g-cit').evaluate(el=>getComputedStyle(el).transform);
  const values=matrix.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number)||[];
  expect(values.length).toBe(6);
  expect(Math.abs(values[0])).toBeLessThan(0.01);
  expect(values[1]).toBeCloseTo(-1,1);
  expect(values[2]).toBeCloseTo(1,1);
  expect(Math.abs(values[3])).toBeLessThan(0.01);

  const city=await expectInsideViewport(page,page.locator('#g-cit'),width,height);
  expect(Math.abs(city.width-width)).toBeLessThan(2);
  expect(Math.abs(city.height-height)).toBeLessThan(2);

  const top=await expectInsideViewport(page,page.locator('#cit-right'),width,height);
  const map=await expectInsideViewport(page,page.locator('#cit-viewport'),width,height);
  const bottom=await expectInsideViewport(page,page.locator('#v2-side'),width,height);
  expect(top.y).toBeLessThan(map.y);
  expect(map.y).toBeLessThan(bottom.y);
  expect(top.bottom).toBeLessThanOrEqual(map.y+8);
  expect(map.bottom).toBeLessThanOrEqual(bottom.y+8);
  expect(map.width).toBeGreaterThan(width*0.55);
  expect(map.height).toBeGreaterThan(height*0.35);

  const topButtons=page.locator('#v2-status-nav > button');
  await expect(topButtons).toHaveCount(2);
  await expectInsideViewport(page,topButtons.nth(0),width,height);
  await expectInsideViewport(page,topButtons.nth(1),width,height);
  await expectInsideViewport(page,page.locator('#cit-hud'),width,height);
  await expectInsideViewport(page,page.locator('#cit-pop-wrap'),width,height);
  await expectInsideViewport(page,page.locator('#cit-week'),width,height);

  await expectInsideViewport(page,page.locator('#cit-tools'),width,height);
  await expectInsideViewport(page,page.locator('#cit-night'),width,height);
  await expectInsideViewport(page,page.locator('#cit-clear'),width,height);

  for(const selector of ['#cit-help','#cit-hud','#cit-week','#cit-night','#cit-pop-wrap','#cit-clear']){
    const tr=await page.locator(selector).evaluate(el=>getComputedStyle(el).transform);
    expect(tr==='none'||!tr.includes('matrix(0, 1')&&!tr.includes('matrix(0, -1')).toBeTruthy();
  }

  const visibleButtons=page.locator('#g-cit button:visible');
  const count=await visibleButtons.count();
  for(let i=0;i<count;i++){
    const button=visibleButtons.nth(i);
    if(await button.evaluate(el=>!!el.closest('#cit-tools')))continue;
    await expectInsideViewport(page,button,width,height);
  }

  const school=page.locator('#cit-tools button').filter({hasText:'🏫'}).first();
  await expect(school).toBeVisible();
  const before=await box(school);
  const needed=Math.max(0,before.right-(width-8));
  await page.locator('#cit-tools').evaluate((el,delta)=>{el.scrollTop+=delta;},needed+12);
  await page.waitForTimeout(80);
  await expectInsideViewport(page,school,width,height);
  await school.click();
  await expect.poll(()=>page.evaluate(()=>citTool)).toBe('K');
});

test('portrait CCW hit-testing opens the building that was actually double-tapped', async ({ page }) => {
  const width=390,height=760;
  await openCity(page,width,height);

  const chosen=await page.evaluate(()=>{
    const tiles=[...document.querySelectorAll('#cit-grid .ct[data-i]')];
    const visible=tiles.filter(el=>{
      const r=el.getBoundingClientRect();
      return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.width>8&&r.height>8;
    });
    const el=visible[Math.floor(visible.length/2)]||tiles[Math.floor(tiles.length/2)];
    const i=Number(el.dataset.i);
    cit.g[i]='H';
    if(typeof save==='function')save();
    if(typeof citRenderTiles==='function')citRenderTiles();
    return i;
  });

  const tile=page.locator(`#cit-grid .ct[data-i="${chosen}"]`);
  const b=await box(tile);
  await page.mouse.click(b.cx,b.cy);
  await page.waitForTimeout(70);
  await page.mouse.click(b.cx,b.cy);
  await expect(page.locator('#cit-interior-v33')).toHaveClass(/open/);
  await expect(page.locator('#ci-room-title')).toContainText('Stue');
  await expectInsideViewport(page,page.locator('#ci-exit'),width,height);
  await expectInsideViewport(page,page.locator('#ci-delete'),width,height);
});

test('portrait CCW painting edits the tile under the physical pointer', async ({ page }) => {
  const width=390,height=760;
  await openCity(page,width,height);

  const setup=await page.evaluate(()=>{
    const tiles=[...document.querySelectorAll('#cit-grid .ct[data-i]')];
    const visible=tiles.filter(el=>{
      const r=el.getBoundingClientRect();
      return r.left>=20&&r.top>=80&&r.right<=innerWidth-20&&r.bottom<=innerHeight-80&&r.width>8&&r.height>8;
    });
    const el=visible[Math.floor(visible.length/2)]||tiles[Math.floor(tiles.length/2)];
    const rect=el.getBoundingClientRect();
    const i=Number(el.dataset.i);
    const cols=(typeof CITY_CFG!=='undefined'&&CITY_CFG.COLS)||12;
    const rows=(typeof CITY_CFG!=='undefined'&&CITY_CFG.ROWS)||Math.ceil(cit.g.length/cols);
    const row=Math.floor(i/cols),col=i%cols;
    cit.g[i]=0;
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const rr=row+dr,cc=col+dc;
      if(rr>=0&&rr<rows&&cc>=0&&cc<cols)cit.g[rr*cols+cc]='R';
    }
    for(const key of ['money','cash','coins','funds'])if(typeof cit[key]==='number')cit[key]=9999;
    if(typeof save==='function')save();
    if(typeof citRenderTiles==='function')citRenderTiles();
    citTool='R';
    return {i,x:rect.left+rect.width/2,y:rect.top+rect.height/2,before:Array.from(cit.g)};
  });
  await expect.poll(()=>page.evaluate(()=>citTool)).toBe('R');
  await page.waitForTimeout(100);

  await page.mouse.click(setup.x,setup.y);
  await page.waitForTimeout(220);

  const result=await page.evaluate(({i,before})=>{
    const after=Array.from(cit.g);
    const changed=[];
    for(let n=0;n<Math.max(before.length,after.length);n++)if(before[n]!==after[n])changed.push(n);
    return {value:after[i],tool:citTool,changed};
  },setup);
  expect(result.tool).toBe('R');
  expect(result.changed).toContain(setup.i);
  expect(result.value).toBe('R');
});
