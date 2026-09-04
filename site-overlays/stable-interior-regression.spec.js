const { test, expect } = require('@playwright/test');

const BASE='http://127.0.0.1:4173/';

async function prepareCity(page){
  await page.goto(BASE);
  await page.evaluate(()=>{
    openCit();
    const cols=CITY_CFG.COLS;
    const h=cols+2, s=cols+3;
    cit.g.fill(0); cit.st={}; cit.shopStock={}; cit.interiors={};
    cit.g[h]='H'; cit.g[s]='S'; cit.st[s]=0; cit.shopStock[s]=4;
    S.city=cit; save(); citFitBoard(); citRenderTiles(); citRenderPeople(); citHud();
    window.__interiorTest={h,s};
  });
  await expect(page.locator('#g-cit')).toHaveClass(/v18-build/);
}

async function doubleClickBuilding(page, selector){
  const box=await page.locator(selector).boundingBox();
  if(!box)throw new Error('building not visible: '+selector);
  await page.mouse.dblclick(box.x+box.width/2,box.y+box.height/2,{delay:80});
}

async function dragTo(page, selector, xPct, yPct){
  const item=page.locator(selector);
  const ib=await item.boundingBox();
  const cb=await page.locator('#ci-canvas').boundingBox();
  if(!ib||!cb)throw new Error('missing drag geometry');
  await page.mouse.move(ib.x+ib.width/2,ib.y+ib.height/2);
  await page.mouse.down();
  await page.mouse.move(cb.x+cb.width*xPct,cb.y+cb.height*yPct,{steps:6});
  await page.mouse.up();
}

test('house and shop interiors open only in build phase and persist', async ({ browser })=>{
  const context=await browser.newContext({viewport:{width:844,height:390}});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await prepareCity(page);

  await doubleClickBuilding(page,'.ct.house');
  await expect(page.locator('#cit-interior-v33')).toHaveClass(/opened/);
  await expect(page.locator('#ci-room-title')).toContainText('Stue');
  await expect(page.locator('#ci-palette-items .ci-choice')).toHaveCount(6);

  await page.locator('.ci-choice[data-type="shelf"]').click();
  await dragTo(page,'.ci-item[aria-label="Hylle"]',.72,.88);
  const shelfTop=parseFloat(await page.locator('.ci-item[aria-label="Hylle"]').evaluate(el=>el.style.top));
  expect(shelfTop).toBeLessThanOrEqual(43);
  const shelfLeft=await page.locator('.ci-item[aria-label="Hylle"]').evaluate(el=>el.style.left);

  await page.locator('.ci-tab[data-tab="objects"]').click();
  await expect(page.locator('#ci-palette-items .ci-choice')).toHaveCount(14);
  await page.locator('.ci-choice[data-type="window"]').click();
  await dragTo(page,'.ci-item[aria-label="Vindu"]',.62,.86);
  const windowTop=parseFloat(await page.locator('.ci-item[aria-label="Vindu"]').evaluate(el=>el.style.top));
  expect(windowTop).toBeLessThanOrEqual(43);

  await page.locator('#ci-exit').click();
  await expect(page.locator('#cit-interior-v33')).not.toHaveClass(/show/);
  await doubleClickBuilding(page,'.ct.house');
  await expect(page.locator('.ci-item[aria-label="Hylle"]')).toHaveCount(1);
  expect(await page.locator('.ci-item[aria-label="Hylle"]').evaluate(el=>el.style.left)).toBe(shelfLeft);
  await page.locator('#ci-exit').click();
  await expect(page.locator('#cit-interior-v33')).not.toHaveClass(/show/);

  await doubleClickBuilding(page,'.ct.shop');
  await expect(page.locator('#ci-room-title')).toContainText('Butikk');
  await expect(page.locator('#ci-palette-items .ci-choice')).toHaveCount(6);
  await page.locator('.ci-tab[data-tab="objects"]').click();
  await expect(page.locator('#ci-palette-items .ci-choice')).toHaveCount(14);
  await page.locator('#ci-exit').click();

  await page.evaluate(()=>{citLock=true;document.querySelector('#g-cit').classList.remove('v18-build');document.querySelector('#g-cit').classList.add('v18-sim');});
  await doubleClickBuilding(page,'.ct.house');
  await expect(page.locator('#cit-interior-v33')).not.toHaveClass(/show/);
  expect(errors).toEqual([]);
  await context.close();
});

test('double tap opens a building on a portrait touch viewport', async ({ browser })=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await prepareCity(page);
  const box=await page.locator('.ct.house').boundingBox();
  if(!box)throw new Error('house not visible in portrait');
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.touchscreen.tap(x,y);
  await page.waitForTimeout(90);
  await page.touchscreen.tap(x,y);
  await expect(page.locator('#cit-interior-v33')).toHaveClass(/opened/);
  await expect(page.locator('#ci-exit')).toBeVisible();
  await page.locator('#ci-exit').click();
  await expect(page.locator('#cit-interior-v33')).not.toHaveClass(/show/);
  await context.close();
});
