const { test, expect } = require('@playwright/test');

const ROOT='http://127.0.0.1:4173/new/city/';

function isMinus90(transform){
  if(!transform||transform==='none')return false;
  const m=new DOMMatrix(transform);
  return Math.abs(m.a)<0.02 && Math.abs(m.d)<0.02 && Math.abs(m.b+1)<0.02 && Math.abs(m.c-1)<0.02;
}

async function box(locator){
  const b=await locator.boundingBox();
  expect(b).not.toBeNull();
  return {...b,right:b.x+b.width,bottom:b.y+b.height,cx:b.x+b.width/2,cy:b.y+b.height/2};
}

test('remaining portrait content counter-rotates without decorating edit actions', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(ROOT);
  await expect(page.locator('#g-cit')).toHaveClass(/v32-rotation-clean/);

  const edit=await page.evaluate(()=>{
    const undo=document.querySelector('#cit-undo');
    const del=document.querySelector('#cit-tools .v23-broom');
    const bad=':scope > .v26-category-svg,:scope > .v27-road-network,:scope > .v29-category-svg';
    return {
      undoText:(undo.textContent||'').trim(),
      deleteText:(del.textContent||'').trim(),
      undoDecor:undo.querySelectorAll(bad).length,
      deleteDecor:del.querySelectorAll(bad).length,
      undoV26:undo.hasAttribute('data-v26-category'),
      deleteV26:del.hasAttribute('data-v26-category')
    };
  });
  expect(edit.undoText).toBe('↶');
  expect(edit.deleteText).toBe('🗑️');
  expect(edit.undoDecor).toBe(0);
  expect(edit.deleteDecor).toBe(0);
  expect(edit.undoV26).toBe(false);
  expect(edit.deleteV26).toBe(false);

  const transforms=await page.evaluate(()=>{
    const tr=sel=>getComputedStyle(document.querySelector(sel)).transform;
    return {
      map:tr('#cit-grid .v23-map-symbol'),
      farm:tr('#cit-grid .farm-decor-symbol'),
      shop:tr('#cit-grid .v32-shop-original-icon')
    };
  });
  expect(isMinus90(transforms.map)).toBe(true);
  expect(isMinus90(transforms.farm)).toBe(true);
  expect(isMinus90(transforms.shop)).toBe(true);

  const dynamic=await page.evaluate(()=>{
    const grid=document.querySelector('#cit-grid');
    const person=citPersonEl('🙂');grid.appendChild(person);
    citSetThought(person,'🏢');
    const vehicle=document.createElement('div');vehicle.className='cit-bus-vehicle';
    const rider=document.createElement('span');rider.className='cit-bus-rider';rider.textContent='🙂';
    vehicle.appendChild(rider);grid.appendChild(vehicle);
    const face=getComputedStyle(person.querySelector('.cit-face')).transform;
    const thought=getComputedStyle(person.querySelector('.cit-thought-icon')).transform;
    const riderTransform=getComputedStyle(rider).transform;
    const body=document.createElement('span');
    const mock={body};
    citBusOrient(mock,0,1);
    const orient=body.style.transform;
    person.remove();vehicle.remove();
    return {face,thought,riderTransform,orient};
  });
  expect(isMinus90(dynamic.face)).toBe(true);
  expect(isMinus90(dynamic.thought)).toBe(true);
  expect(isMinus90(dynamic.riderTransform)).toBe(true);
  expect(dynamic.orient.startsWith('rotate(-90deg)')).toBe(true);
});

test('day tracker is physically horizontal and money stays on one readable line', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(ROOT);
  await expect(page.locator('#v32-day-display .v32-day-token')).toHaveCount(7);

  const tokens=page.locator('#v32-day-display .v32-day-token');
  const boxes=[];
  for(let i=0;i<7;i++)boxes.push(await box(tokens.nth(i)));

  const ySpread=Math.max(...boxes.map(b=>b.cy))-Math.min(...boxes.map(b=>b.cy));
  const xSpread=Math.max(...boxes.map(b=>b.cx))-Math.min(...boxes.map(b=>b.cx));
  expect(ySpread).toBeLessThan(4);
  expect(xSpread).toBeGreaterThan(90);
  expect(boxes[0].cx).toBeLessThan(boxes[6].cx);

  const dayTransforms=await tokens.evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
  dayTransforms.forEach(t=>expect(isMinus90(t)).toBe(true));

  const money=await box(page.locator('#cit-hud'));
  expect(money.width).toBeGreaterThan(money.height);
  const moneyText=(await page.locator('#cit-money-wrap').innerText()).replace(/\s+/g,'');
  expect(moneyText).toMatch(/🪙\d+/);
});

test('stats and settings cards cancel the city rotation and remain on-screen', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(ROOT);

  await page.locator('#cit-pop-wrap').click();
  await expect(page.locator('#cit-v18-stats')).toHaveClass(/show/);
  const statsTransform=await page.locator('.v18-stats-card').evaluate(el=>getComputedStyle(el).transform);
  expect(isMinus90(statsTransform)).toBe(true);
  const stats=await box(page.locator('.v18-stats-card'));
  expect(stats.x).toBeGreaterThanOrEqual(-1);
  expect(stats.right).toBeLessThanOrEqual(710);
  expect(stats.y).toBeGreaterThanOrEqual(-1);
  expect(stats.bottom).toBeLessThanOrEqual(1537);
  await page.locator('.v18-stats-close').click();

  await page.locator('#v25-menu').click();
  await expect(page.locator('#cit-settings')).toHaveClass(/show/);
  await page.waitForTimeout(450);

  const settingsTransform=await page.locator('#cit-settings-card').evaluate(el=>getComputedStyle(el).transform);
  expect(isMinus90(settingsTransform)).toBe(true);
  const settings=await box(page.locator('#cit-settings-card'));
  expect(settings.x).toBeGreaterThanOrEqual(-1);
  expect(settings.right).toBeLessThanOrEqual(710);
  expect(settings.y).toBeGreaterThanOrEqual(-1);
  expect(settings.bottom).toBeLessThanOrEqual(1537);

  await expect(page.locator('#v26-delete-setting')).toHaveCount(1);
  await expect(page.locator('#v26-delete-setting')).toBeVisible();
  const oldDelete=page.locator('#v24-delete-setting');
  if(await oldDelete.count())await expect(oldDelete).toBeHidden();

  const sizeText=(await page.locator('#cit-settings-card').innerText()).replace(/\s+/g,' ');
  expect(sizeText).toContain('15×10');
  expect(sizeText).toContain('30×20');
  expect(sizeText).toContain('60×40');
});
