const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const url = pathToFileURL(path.join(process.cwd(),'dist/new/index.html')).href;

async function activeId(page){
  return page.evaluate(() => document.querySelector('.screen.active')?.id || '');
}

test('new home and every game keep a working exit button', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(url);
  await page.waitForTimeout(200);

  const homeState = await page.evaluate(() => {
    const grid=document.querySelector('#home .menu-grid');
    return {
      childCount:grid.children.length,
      nonCards:[...grid.children].filter(el=>!el.classList.contains('menu-card')).map(el=>el.id||el.className),
      cards:[...grid.querySelectorAll(':scope > .menu-card')].map(el => {
        const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
        return {id:el.id,display:cs.display,visibility:cs.visibility,opacity:cs.opacity,left:r.left,top:r.top,width:r.width,height:r.height};
      })
    };
  });
  expect(homeState.childCount).toBe(6);
  expect(homeState.nonCards).toEqual([]);
  const homeCards=homeState.cards;
  expect(homeCards.length).toBe(6);
  homeCards.forEach(c => {
    expect(c.display).not.toBe('none');
    expect(c.visibility).toBe('visible');
    expect(Number(c.opacity)).toBeGreaterThan(0);
    expect(c.width).toBeGreaterThan(100);
    expect(c.height).toBeGreaterThan(100);
  });
  expect(Math.abs(homeCards[0].top-homeCards[1].top)).toBeLessThan(2);
  expect(Math.abs(homeCards[0].left-homeCards[2].left)).toBeLessThan(2);

  const games=[
    ['card-bal','g-bal'],
    ['card-cre','g-cre'],
    ['card-pat','g-pat'],
    ['card-wal','g-wal'],
    ['card-sdk','g-sdk']
  ];
  for(const [card,screen] of games){
    await page.click('#'+card);
    await expect.poll(()=>activeId(page)).toBe(screen);
    const back=page.locator('#'+screen+' .nav-home');
    await expect(back).toBeVisible();
    await expect(back).toHaveText('←');
    await back.click();
    await expect.poll(()=>activeId(page)).toBe('home');
  }

  await page.click('#card-cit');
  await expect.poll(()=>activeId(page)).toBe('g-cit');
  const cityBack=page.locator('#v25-exit');
  await expect(cityBack).toBeVisible();
  await cityBack.click();
  await expect.poll(()=>activeId(page)).toBe('home');

  expect(await page.evaluate(() => !!(typeof sfx==='function' && sfx.__v29QuietClicks))).toBe(true);
});

test('city controls stay compact, scrollable and semantic', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(url);
  await page.click('#card-cit');
  await page.waitForTimeout(250);

  const mapBox=await page.locator('#cit-viewport').boundingBox();
  expect(mapBox).not.toBeNull();
  expect(mapBox.width).toBeGreaterThanOrEqual(670);
  expect(mapBox.height).toBeGreaterThanOrEqual(1000);

  const category=page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category]');
  await expect(category).toHaveCount(3);
  await expect(category.nth(0).locator('.v29-road-network')).toHaveCount(1);

  await category.nth(1).click();
  await page.waitForTimeout(80);
  await expect(page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category]').nth(0).locator('.v29-road-network')).toHaveCount(1);

  await page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category]').nth(2).click();
  await page.waitForTimeout(100);
  await expect(page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category]').nth(0).locator('.v29-road-network')).toHaveCount(1);

  const fixedOrder=await page.evaluate(() => {
    const cats=document.querySelector('#cit-tools .v23-category-col');
    return [...cats.children].map(el => ({
      id:el.id,
      cls:el.className,
      label:el.getAttribute('aria-label')||''
    }));
  });
  expect(fixedOrder[0].id).toBe('cit-undo');
  expect(fixedOrder[1].label).toBe('Fjern');
  expect(fixedOrder[2].cls).toContain('v30-edit-sep');
  const sepStyle=await page.evaluate(() => {
    const el=document.querySelector('#cit-tools .v30-edit-sep');
    const cs=getComputedStyle(el);
    return {height:parseFloat(cs.height),background:cs.backgroundColor};
  });
  expect(sepStyle.height).toBeGreaterThanOrEqual(1);
  expect(sepStyle.background).not.toBe('rgba(0, 0, 0, 0)');

  const parkScroll=await page.evaluate(() => {
    const el=document.querySelector('#cit-tools .v23-content-col');
    const cs=getComputedStyle(el);
    return {
      buttons:el.children.length,
      overflowY:cs.overflowY,
      scrollHeight:el.scrollHeight,
      clientHeight:el.clientHeight
    };
  });
  expect(parkScroll.buttons).toBe(7);
  expect(['auto','scroll']).toContain(parkScroll.overflowY);
  const lastPark=page.locator('#cit-tools .v23-content-col > .v23-tool-btn').last();
  await lastPark.scrollIntoViewIfNeeded();
  await expect(lastPark).toBeVisible();
  await lastPark.click();
  await expect.poll(()=>page.evaluate(() => citTool)).toBe('W');

  const undoState=await page.evaluate(() => {
    const undo=document.querySelector('#cit-undo'), cats=document.querySelector('#cit-tools .v23-category-col');
    const r=undo.getBoundingClientRect(),vr=document.querySelector('#g-cit').getBoundingClientRect();
    return {insideCategory:undo.parentElement===cats,firstChild:cats.firstElementChild===undo,left:r.left,top:r.top,right:r.right,bottom:r.bottom,viewLeft:vr.left,viewTop:vr.top,viewRight:vr.right,viewBottom:vr.bottom};
  });
  expect(undoState.insideCategory).toBe(true);
  expect(undoState.firstChild).toBe(true);
  expect(undoState.right).toBeGreaterThan(0);
  expect(undoState.bottom).toBeGreaterThan(0);
  expect(undoState.left).toBeLessThan(709);
  expect(undoState.top).toBeLessThan(1536);

  await page.locator('#v25-menu').click();
  await page.waitForTimeout(450);
  const deleteState=await page.evaluate(() => {
    const el=document.querySelector('#v26-delete-setting')||document.querySelector('#v24-delete-setting');
    if(!el)return null;
    const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {cls:el.className,display:cs.display,visibility:cs.visibility,opacity:Number(cs.opacity),left:r.left,top:r.top,right:r.right,bottom:r.bottom};
  });
  expect(deleteState).not.toBeNull();
  expect(deleteState.cls).not.toContain('v25-nav-source');
  expect(deleteState.display).not.toBe('none');
  expect(deleteState.visibility).toBe('visible');
  expect(deleteState.opacity).toBeGreaterThan(0);
  expect(deleteState.right).toBeGreaterThan(0);
  expect(deleteState.bottom).toBeGreaterThan(0);
  expect(deleteState.left).toBeLessThan(709);
  expect(deleteState.top).toBeLessThan(1536);

  await page.keyboard.press('Escape');
  await page.evaluate(() => document.querySelector('#cit-settings')?.classList.remove('show'));

  const thought=await page.evaluate(async () => {
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const el=citPersonEl('🙂');
    citSetThought(el,'🏢');
    await sleep(40);
    let bubble=el.querySelector('.cit-thought'),glyph=el.querySelector('.cit-thought-icon');
    const first={bubble:!!bubble,text:glyph?.textContent||'',font:parseFloat(getComputedStyle(glyph).fontSize)||0,plain:glyph?.classList.contains('v29-plain-thought')||false};
    citSetThought(el,'🏫');
    await sleep(40);
    bubble=el.querySelector('.cit-thought');glyph=el.querySelector('.cit-thought-icon');
    const second={bubble:!!bubble,text:glyph?.textContent||'',font:parseFloat(getComputedStyle(glyph).fontSize)||0};
    citSetThought(el,null);
    await sleep(20);
    const cleared=!el.querySelector('.cit-thought');
    el.remove();
    return {first,second,cleared};
  });
  expect(thought.first.bubble).toBe(true);
  expect(thought.first.text).toBe('🏢');
  expect(thought.first.font).toBeGreaterThan(0);
  expect(thought.first.plain).toBe(true);
  expect(thought.second.bubble).toBe(true);
  expect(thought.second.text).toBe('🏫');
  expect(thought.second.font).toBeGreaterThan(0);
  expect(thought.cleared).toBe(true);

  await page.evaluate(() => { citHelpMode='default'; citRenderHelp(); });
  await page.waitForTimeout(50);
  const moon=await page.evaluate(() => {
    const cue=document.querySelector('#v29-moon-cue'),night=document.querySelector('#cit-night');
    if(!cue||!night)return null;
    const a=getComputedStyle(cue),b=getComputedStyle(night);
    return {cueColor:a.backgroundColor,nightColor:b.backgroundColor,cueImage:a.backgroundImage,nightImage:b.backgroundImage};
  });
  expect(moon).not.toBeNull();
  expect(moon.cueColor).toBe(moon.nightColor);
  expect(moon.cueImage).toBe(moon.nightImage);
  expect(moon.cueImage!=='none' || moon.cueColor!=='rgba(0, 0, 0, 0)').toBe(true);
});


test('park action list responds to real touch scrolling without moving fixed controls', async ({ browser }) => {
  const context=await browser.newContext({
    viewport:{width:709,height:1536},
    isMobile:true,
    hasTouch:true
  });
  const page=await context.newPage();
  await page.goto(url);
  await page.click('#card-cit');
  await page.waitForTimeout(250);

  const category=page.locator('#cit-tools .v23-category-col > .v23-tool-btn[data-v29-category]');
  await category.nth(2).click();
  await page.waitForTimeout(100);

  const before=await page.evaluate(() => {
    const content=document.querySelector('#cit-tools .v23-content-col');
    const undo=document.querySelector('#cit-undo').getBoundingClientRect();
    const remove=document.querySelector('#cit-tools .v23-broom').getBoundingClientRect();
    const firstCategory=document.querySelector('#cit-tools .v23-tool-btn[data-v29-category]').getBoundingClientRect();
    const r=content.getBoundingClientRect();
    return {
      scrollTop:content.scrollTop,
      scrollHeight:content.scrollHeight,
      clientHeight:content.clientHeight,
      content:{left:r.left,top:r.top,width:r.width,height:r.height},
      fixed:{
        undo:{left:undo.left,top:undo.top},
        remove:{left:remove.left,top:remove.top},
        category:{left:firstCategory.left,top:firstCategory.top}
      }
    };
  });
  expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);

  const client=await context.newCDPSession(page);
  const y=before.content.top+before.content.height/2;
  const xA=before.content.left+before.content.width*.78;
  const xB=before.content.left+before.content.width*.22;

  async function swipe(x1,x2){
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y}]});
    const steps=6;
    for(let i=1;i<=steps;i++){
      const x=x1+(x2-x1)*(i/steps);
      await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
      await page.waitForTimeout(18);
    }
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForTimeout(180);
  }

  await swipe(xA,xB);
  let afterScroll=await page.evaluate(() => document.querySelector('#cit-tools .v23-content-col').scrollTop);
  if(afterScroll===0){
    await swipe(xB,xA);
    afterScroll=await page.evaluate(() => document.querySelector('#cit-tools .v23-content-col').scrollTop);
  }
  expect(afterScroll).toBeGreaterThan(0);

  const after=await page.evaluate(() => {
    const undo=document.querySelector('#cit-undo').getBoundingClientRect();
    const remove=document.querySelector('#cit-tools .v23-broom').getBoundingClientRect();
    const firstCategory=document.querySelector('#cit-tools .v23-tool-btn[data-v29-category]').getBoundingClientRect();
    return {
      undo:{left:undo.left,top:undo.top},
      remove:{left:remove.left,top:remove.top},
      category:{left:firstCategory.left,top:firstCategory.top}
    };
  });
  for(const key of ['undo','remove','category']){
    expect(Math.abs(after[key].left-before.fixed[key].left)).toBeLessThan(1);
    expect(Math.abs(after[key].top-before.fixed[key].top)).toBeLessThan(1);
  }

  const lastPark=page.locator('#cit-tools .v23-content-col > .v23-tool-btn').last();
  await lastPark.scrollIntoViewIfNeeded();
  await expect(lastPark).toBeVisible();
  await lastPark.click();
  await expect.poll(()=>page.evaluate(() => citTool)).toBe('W');

  await context.close();
});
