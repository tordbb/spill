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

  const category=page.locator('#cit-tools .v23-category-col > .v23-tool-btn');
  await expect(category).toHaveCount(5);
  await expect(category.nth(0).locator('.v29-road-network')).toHaveCount(1);

  await category.nth(1).click();
  await page.waitForTimeout(80);
  await expect(page.locator('#cit-tools .v23-category-col > .v23-tool-btn').nth(0).locator('.v29-road-network')).toHaveCount(1);

  await page.locator('#cit-tools .v23-category-col > .v23-tool-btn').nth(2).click();
  await page.waitForTimeout(100);
  await expect(page.locator('#cit-tools .v23-category-col > .v23-tool-btn').nth(0).locator('.v29-road-network')).toHaveCount(1);

  const parkScroll=await page.evaluate(() => {
    const el=document.querySelector('#cit-tools .v23-content-col');
    const last=el.lastElementChild;
    el.scrollTop=el.scrollHeight;
    const cs=getComputedStyle(el);
    return {
      buttons:el.children.length,
      overflowY:cs.overflowY,
      scrollTop:el.scrollTop,
      scrollHeight:el.scrollHeight,
      clientHeight:el.clientHeight,
      lastBottom:last.offsetTop+last.offsetHeight
    };
  });
  expect(parkScroll.buttons).toBe(7);
  expect(['auto','scroll']).toContain(parkScroll.overflowY);
  expect(parkScroll.lastBottom).toBeLessThanOrEqual(parkScroll.scrollTop+parkScroll.clientHeight+2);

  const undoState=await page.evaluate(() => {
    const undo=document.querySelector('#cit-undo'), cats=document.querySelector('#cit-tools .v23-category-col');
    const r=undo.getBoundingClientRect(),vr=document.querySelector('#g-cit').getBoundingClientRect();
    return {insideCategory:undo.parentElement===cats,left:r.left,top:r.top,right:r.right,bottom:r.bottom,viewLeft:vr.left,viewTop:vr.top,viewRight:vr.right,viewBottom:vr.bottom};
  });
  expect(undoState.insideCategory).toBe(true);
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
    return cue&&night?{cue:getComputedStyle(cue).backgroundColor,night:getComputedStyle(night).backgroundColor}:null;
  });
  expect(moon).not.toBeNull();
  expect(moon.cue).toBe(moon.night);
  expect(moon.cue).not.toBe('rgba(0, 0, 0, 0)');
});
