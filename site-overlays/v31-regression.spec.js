const { test, expect } = require('@playwright/test');

const ROOT='http://127.0.0.1:4173/new/';
const routes=[
  ['card-bal','balance','g-bal'],
  ['card-cre','creature','g-cre'],
  ['card-pat','patterns','g-pat'],
  ['card-wal','walk','g-wal'],
  ['card-sdk','sudoku','g-sdk'],
  ['card-cit','city','g-cit']
];

const box=async(locator)=>{
  const b=await locator.boundingBox();
  expect(b).not.toBeNull();
  return {...b,right:b.x+b.width,bottom:b.y+b.height,cx:b.x+b.width/2,cy:b.y+b.height/2};
};

test('each /new game is a separate document and Android-style back returns home', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(ROOT);
  await expect(page.locator('#home')).toHaveClass(/active/);
  await expect(page.locator('.screen')).toHaveCount(1);

  for(const [card,slug,target] of routes){
    await page.goto(ROOT);
    await page.click('#'+card);
    await expect(page).toHaveURL(new RegExp('/new/'+slug+'/?$'));
    await expect(page.locator('.screen')).toHaveCount(1);
    await expect(page.locator('#'+target)).toHaveClass(/active/);

    if(slug!=='city'){
      await expect(page.locator('#cit-clear,#v24-delete-setting,#v26-delete-setting')).toHaveCount(0);
      const bodyText=await page.locator('body').innerText();
      expect(bodyText).not.toContain('Slett byen');
      await expect(page.locator('script#city-visual-v31-script')).toHaveCount(0);
    }

    const back=page.locator('#'+target+' .nav-home,#v25-exit').first();
    await expect(back).toBeVisible();

    // One browser-back action must land on /new/, not leave the site.
    await page.goBack();
    await expect(page).toHaveURL(/\/new\/?$/);
    await expect(page.locator('#home')).toHaveClass(/active/);
  }
});

test('direct game entry also keeps one browser-back step inside /new', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(ROOT+'sudoku/');
  await expect(page.locator('#g-sdk')).toHaveClass(/active/);
  await page.goBack();
  await expect(page).toHaveURL(/\/new\/?$/);
  await expect(page.locator('#home')).toHaveClass(/active/);
});

async function assertCityStructure(page,width,height){
  await page.setViewportSize({width,height});
  await page.goto(ROOT+'city/');
  await expect(page.locator('#g-cit')).toHaveClass(/v31-layout/);

  const exit=await box(page.locator('#v25-exit'));
  const help=await box(page.locator('#v31-help-display'));
  const menu=await box(page.locator('#v25-menu'));
  expect(exit.cx).toBeLessThan(help.cx);
  expect(help.cx).toBeLessThan(menu.cx);

  const top=await box(page.locator('#v31-top'));
  const map=await box(page.locator('#cit-viewport'));
  const bottom=await box(page.locator('#v31-bottom'));
  expect(top.bottom).toBeLessThanOrEqual(map.y+8);
  expect(map.bottom).toBeLessThanOrEqual(bottom.y+8);
  expect(map.width).toBeGreaterThan(width*0.5);

  const actions=await box(page.locator('#v31-actions'));
  const status=await box(page.locator('#v31-status'));
  expect(actions.x).toBeLessThan(status.x);
  expect(Math.abs(actions.y-status.y)).toBeLessThan(2);
  expect(Math.abs(actions.height-status.height)).toBeLessThan(2);

  const cats=await box(page.locator('#cit-tools .v23-category-col'));
  const content=await box(page.locator('#cit-tools .v23-content-col'));
  expect(cats.y).toBeLessThan(content.y);

  const money=await box(page.locator('#v31-money-cell'));
  const stats=await box(page.locator('#v31-stats-cell'));
  const day=await box(page.locator('#v31-day-cell'));
  const moon=await box(page.locator('#v31-moon-cell'));
  expect(money.cx).toBeLessThan(stats.cx);
  expect(day.cx).toBeLessThan(moon.cx);
  expect(money.cy).toBeLessThan(day.cy);
  expect(stats.cy).toBeLessThan(moon.cy);

  const helpText=(await page.locator('#v31-help-display').getAttribute('aria-label'))||'';
  expect(helpText.length).toBeGreaterThan(10);

  // Move away from roads and verify the drawing itself has no fake selection frame.
  const categories=page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category]');
  await categories.nth(1).click();
  await page.waitForTimeout(80);
  const roadState=await page.evaluate(()=>{
    const b=document.querySelector('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category="0"]');
    const icon=b.querySelector('.v29-road-network,.v27-road-network');
    const s=getComputedStyle(icon);
    return {
      open:b.classList.contains('category-open'),
      selected:b.classList.contains('sel'),
      border:s.borderTopWidth,
      iconShadow:s.boxShadow,
      buttonOutline:getComputedStyle(b).outlineStyle,
      buttonShadow:getComputedStyle(b).boxShadow,
      transform:getComputedStyle(b).transform
    };
  });
  expect(roadState.open).toBe(false);
  expect(roadState.border).toBe('0px');
  expect(roadState.iconShadow).toBe('none');
  expect(roadState.buttonOutline).toBe('none');
  expect(roadState.buttonShadow).toBe('none');
  expect(roadState.transform).not.toBe('none');

  return {top,map,bottom,actions,status};
}

test('city uses the same portrait-first top/map/bottom structure in portrait and landscape', async ({ page }) => {
  const portrait=await assertCityStructure(page,709,1536);
  expect(portrait.map.width).toBeGreaterThan(650);

  const landscape=await assertCityStructure(page,1536,709);
  expect(landscape.top.height).toBeLessThan(90);
  expect(landscape.bottom.height).toBeLessThan(210);
});

test('park action contents track the finger direction with native scrolling', async ({ browser }) => {
  const context=await browser.newContext({
    viewport:{width:709,height:1536},
    isMobile:true,
    hasTouch:true
  });
  const page=await context.newPage();
  await page.goto(ROOT+'city/');
  await expect(page.locator('#g-cit')).toHaveClass(/v31-layout/);

  const categories=page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category]');
  await categories.nth(2).click();
  await page.waitForTimeout(100);

  const content=page.locator('#cit-tools .v23-content-col');
  const state=await page.evaluate(()=>{
    const el=document.querySelector('#cit-tools .v23-content-col');
    return {scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,scrollTop:el.scrollTop};
  });
  expect(state.scrollHeight).toBeGreaterThan(state.clientHeight);

  const cr=await box(content);
  const first=page.locator('#cit-tools .v23-content-col > .v23-tool-btn').first();
  const before=await box(first);

  // The internal vertical scroll axis is physically horizontal because the city
  // screen is rotated. Drag the finger left and the list must visibly move left.
  const client=await context.newCDPSession(page);
  const y=cr.cy;
  const startX=cr.x+cr.width*0.78;
  const endX=startX-42;
  await page.evaluate(() => {
    const el=document.querySelector('#cit-tools .v23-content-col');
    window.__v31TouchDiag={start:0,move:0,x0:null,x1:null};
    el.addEventListener('touchstart',e=>{const t=e.touches[0];window.__v31TouchDiag.start++;window.__v31TouchDiag.x0=t&&t.clientX;},true);
    el.addEventListener('touchmove',e=>{const t=e.touches[0];window.__v31TouchDiag.move++;window.__v31TouchDiag.x1=t&&t.clientX;},true);
  });
  console.log('V31_SCROLL_TARGET',JSON.stringify(await page.evaluate(({x,y})=>{
    const el=document.elementFromPoint(x,y);
    const content=document.querySelector('#cit-tools .v23-content-col');
    return {tag:el?.tagName,id:el?.id||'',cls:el?.className||'',inside:!!(el&&(el===content||content.contains(el))),installed:content.dataset.v31PhysicalScroller||'',max:content.scrollHeight-content.clientHeight};
  },{x:startX,y})));
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:startX,y}]});
  for(let i=1;i<=6;i++){
    const x=startX+(endX-startX)*(i/6);
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
    await page.waitForTimeout(18);
  }
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(100);

  const after=await box(first);
  const scrollTop=await page.evaluate(()=>document.querySelector('#cit-tools .v23-content-col').scrollTop);
  console.log('V31_SCROLL_AFTER',JSON.stringify(await page.evaluate(()=>({diag:window.__v31TouchDiag,scrollTop:document.querySelector('#cit-tools .v23-content-col').scrollTop}))));
  expect(scrollTop).toBeGreaterThan(0);
  expect(after.x).toBeLessThan(before.x);

  const fingerDelta=endX-startX;
  const listDelta=after.x-before.x;
  expect(Math.sign(listDelta)).toBe(Math.sign(fingerDelta));
  expect(Math.abs(listDelta)).toBeGreaterThan(8);
  expect(Math.abs(listDelta)).toBeLessThan(80);

  const fixedBefore=await Promise.all([
    box(page.locator('#cit-undo')),
    box(page.locator('#cit-tools .v23-broom')),
    box(page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category="0"]'))
  ]);

  // Scroll farther and verify the last park action becomes reachable while fixed
  // controls stay put.
  for(let i=0;i<4;i++){
    const s=await page.evaluate(()=>{
      const el=document.querySelector('#cit-tools .v23-content-col');
      return {top:el.scrollTop,max:el.scrollHeight-el.clientHeight};
    });
    if(s.top>=s.max-1)break;
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:startX,y}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:endX,y}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(80);
  }

  const last=page.locator('#cit-tools .v23-content-col > .v23-tool-btn').last();
  await expect(last).toBeVisible();
  await last.click();
  await expect.poll(()=>page.evaluate(()=>citTool)).toBe('W');

  const fixedAfter=await Promise.all([
    box(page.locator('#cit-undo')),
    box(page.locator('#cit-tools .v23-broom')),
    box(page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category="0"]'))
  ]);
  for(let i=0;i<fixedBefore.length;i++){
    expect(Math.abs(fixedAfter[i].x-fixedBefore[i].x)).toBeLessThan(1);
    expect(Math.abs(fixedAfter[i].y-fixedBefore[i].y)).toBeLessThan(1);
  }

  await context.close();
});
