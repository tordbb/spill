const { test } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const url = pathToFileURL(path.join(process.cwd(),'dist/new/index.html')).href;

test('diagnose current /new runtime', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(url);
  await page.waitForTimeout(250);

  const home = await page.evaluate(() => ({
    active: document.querySelector('.screen.active')?.id,
    cards: [...document.querySelectorAll('#home .menu-card')].map(el => {
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {id:el.id,display:cs.display,visibility:cs.visibility,left:r.left,top:r.top,width:r.width,height:r.height};
    })
  }));
  console.log('V29_HOME', JSON.stringify(home));

  await page.click('#card-cre');
  await page.waitForTimeout(100);
  const creature = await page.evaluate(() => ({
    active: document.querySelector('.screen.active')?.id,
    homes: [...document.querySelectorAll('#g-cre .nav-home')].map(el => {
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {text:el.textContent,cls:el.className,display:cs.display,visibility:cs.visibility,opacity:cs.opacity,left:r.left,top:r.top,width:r.width,height:r.height};
    })
  }));
  console.log('V29_CREATURE', JSON.stringify(creature));
  const nav = page.locator('#g-cre .nav-home');
  await nav.click({force:true});
  await page.waitForTimeout(100);
  console.log('V29_AFTER_HOME', await page.evaluate(() => document.querySelector('.screen.active')?.id));

  await page.click('#card-cit');
  await page.waitForTimeout(250);
  const city = await page.evaluate(() => {
    const box = sel => {
      const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {sel,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,display:cs.display,overflow:cs.overflow,overflowY:cs.overflowY};
    };
    return {
      active:document.querySelector('.screen.active')?.id,
      rail:box('#v23-rail'),
      info:box('#v23-info'),
      tools:box('#cit-tools'),
      viewport:box('#cit-viewport'),
      content:box('#cit-tools .v23-content-col'),
      edit:box('#v28-edit-actions,#v27-edit-actions'),
      undo:box('#cit-undo')
    };
  });
  console.log('V29_CITY',JSON.stringify(city));

  const thought = await page.evaluate(() => {
    if(typeof citPersonEl!=='function'||typeof citSetThought!=='function')return {error:'missing functions'};
    const el=citPersonEl('🙂');
    citSetThought(el,'🏢');
    return new Promise(resolve=>setTimeout(()=>{
      const bubble=el.querySelector('.cit-thought'),glyph=el.querySelector('.cit-thought-icon');
      resolve({
        bubble:!!bubble,
        bubbleDisplay:bubble?getComputedStyle(bubble).display:null,
        glyphText:glyph?.textContent||'',
        glyphHTML:glyph?.innerHTML||'',
        glyphClass:glyph?.className||''
      });
      el.remove();
    },30));
  });
  console.log('V29_THOUGHT',JSON.stringify(thought));
});
