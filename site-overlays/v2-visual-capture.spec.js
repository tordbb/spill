const { test, expect } = require('@playwright/test');
const fs=require('fs');

const V2='http://127.0.0.1:4173/v2/';
const OUT='visual-captures';

async function openCity(page,width,height){
  await page.setViewportSize({width,height});
  await page.goto(V2);
  await page.click('#card-cit');
  await expect(page.locator('#g-cit')).toHaveClass(/active/);
  await page.waitForTimeout(300);
}

test('capture browser-verified v2 city views', async ({page})=>{
  fs.mkdirSync(OUT,{recursive:true});

  await openCity(page,390,760);
  await page.screenshot({path:`${OUT}/portrait-main.png`});

  await page.evaluate(()=>{
    const cols=CITY_CFG.COLS;
    cit.g=Array(CITY_CFG.COLS*CITY_CFG.ROWS).fill(0);
    const road=[];
    for(let c=23;c<=28;c++){const i=2*cols+c;cit.g[i]='R';road.push(i);}
    cit.busLines=[{id:1,stops:[road[0],road[road.length-1]]}];
    citBusSelectedLine=1;
    citTool='BUS';
    citInvalidateBusCache();
    citRenderTiles();
    citRenderHelp();
  });
  await page.waitForTimeout(120);
  await page.screenshot({path:`${OUT}/portrait-bus-route.png`});

  await page.click('#cit-pop-wrap');
  await expect(page.locator('#cit-v18-stats')).toHaveClass(/show/);
  await page.screenshot({path:`${OUT}/portrait-stats.png`});
  await page.click('.v18-stats-close');

  await page.click('#cit-settings-btn');
  await expect(page.locator('#cit-settings')).toHaveClass(/show/);
  await page.screenshot({path:`${OUT}/portrait-settings.png`});

  await page.goto(V2);
  await openCity(page,844,350);
  await page.screenshot({path:`${OUT}/landscape-main.png`});
  await page.locator('#v2-nav > button').nth(1).click();
  await expect(page.locator('#cit-settings')).toHaveClass(/show/);
  await page.screenshot({path:`${OUT}/landscape-settings.png`});
});
