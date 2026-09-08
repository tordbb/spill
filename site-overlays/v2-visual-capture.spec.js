const { test, expect } = require('@playwright/test');
const fs=require('fs');

const ROOT='http://127.0.0.1:4173/';
const V2=ROOT+'v2/';
const OUT='visual-captures';

async function openCity(page,url,width,height){
  await page.setViewportSize({width,height});
  await page.goto(url);
  await page.click('#card-cit');
  await expect(page.locator('#g-cit')).toHaveClass(/active/);
  await page.waitForTimeout(300);
}

test('capture browser-verified promoted main city views', async ({page})=>{
  fs.mkdirSync(OUT,{recursive:true});

  await openCity(page,ROOT,390,760);
  await expect(page.locator('#city-main-responsive-script')).toHaveCount(1);
  await expect(page.locator('#city-v2-responsive-script')).toHaveCount(0);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-portrait/);
  expect(await page.locator('#g-cit').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  await page.screenshot({path:`${OUT}/main-portrait.png`});

  await page.evaluate(()=>{
    const cols=CITY_CFG.COLS;
    cit.g=Array(CITY_CFG.COLS*CITY_CFG.ROWS).fill(0);
    const road=[];
    for(let c=3;c<=10;c++){const i=7*cols+c;cit.g[i]='R';road.push(i);}
    cit.busLines=[{id:1,stops:[road[0],road[road.length-1]]}];
    citBusSelectedLine=1;
    citTool='BUS';
    citInvalidateBusCache();
    citRenderTiles();
    citRenderHelp();
  });
  await page.waitForTimeout(120);
  await page.screenshot({path:`${OUT}/main-portrait-bus-route.png`});

  await page.evaluate(()=>{
    cit.g=Array(CITY_CFG.COLS*CITY_CFG.ROWS).fill(0);
    const homes=[citIdx(2,2),citIdx(8,18),citIdx(15,27)];
    homes.forEach(i=>cit.g[i]='H');
    cit.ppl=[{h:homes[0],pref:'O',fam:false}];
    cit.busLines=[];
    citBusSelectedLine=null;
    citRenderTiles();
    citHud();
  });
  await page.click('#cit-pop-wrap');
  await expect(page.locator('#cit-v18-stats')).toHaveClass(/show/);
  await expect(page.locator('.v18-stat-row').filter({hasText:'Boliger'})).toContainText('1/3');
  await expect(page.locator('.v18-stat-row').filter({hasText:'Boliger'})).toContainText('2 ledig');
  await page.screenshot({path:`${OUT}/main-portrait-stats.png`});
  await page.click('.v18-stats-close');

  await page.click('#cit-settings-btn');
  await expect(page.locator('#cit-settings')).toHaveClass(/show/);
  await expect(page.locator('#v2-clear-setting #cit-clear')).toBeVisible();
  await page.screenshot({path:`${OUT}/main-portrait-settings.png`});

  await openCity(page,ROOT,844,350);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-landscape/);
  await page.screenshot({path:`${OUT}/main-landscape.png`});
  await page.locator('#v2-nav > button').nth(1).click();
  await expect(page.locator('#cit-settings')).toHaveClass(/show/);
  await page.screenshot({path:`${OUT}/main-landscape-settings.png`});

  // The /v2 mirror should still receive the same promoted implementation, with
  // only its marker names relabelled by the idempotent v2 injector.
  await openCity(page,V2,390,760);
  await expect(page.locator('#city-v2-responsive-script')).toHaveCount(1);
  await expect(page.locator('#city-main-responsive-script')).toHaveCount(0);
  await expect(page.locator('#g-cit')).toHaveClass(/v2-portrait/);
  expect(await page.locator('#g-cit').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
});
