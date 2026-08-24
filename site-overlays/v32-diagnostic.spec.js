const { test } = require('@playwright/test');
const ROOT='http://127.0.0.1:4173/new/city/';

test('v32 inspect rotation targets', async ({ page }) => {
  await page.setViewportSize({width:709,height:1536});
  await page.goto(ROOT);
  await page.waitForTimeout(300);

  const grid=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('#cit-grid *')].filter(el=>{
      const cs=getComputedStyle(el),r=el.getBoundingClientRect();
      const text=(el.childNodes.length===1&&el.firstChild?.nodeType===Node.TEXT_NODE?(el.textContent||'').trim():'');
      return (text||el.tagName==='SVG'||el.className)&&r.width>2&&r.height>2;
    }).slice(0,120).map(el=>{
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return {tag:el.tagName,id:el.id||'',cls:typeof el.className==='string'?el.className:(el.className?.baseVal||''),text:(el.textContent||'').trim().slice(0,20),transform:cs.transform,left:r.left,top:r.top,width:r.width,height:r.height};
    });
    const tiles=[...document.querySelectorAll('#cit-grid .ct')].filter(el=>(el.textContent||'').trim()).slice(0,20).map(el=>({cls:el.className,text:(el.textContent||'').trim().slice(0,30),html:el.innerHTML.slice(0,240)}));
    return {nodes,tiles};
  });
  console.log('V32_GRID',JSON.stringify(grid));

  await page.locator('#cit-pop-wrap').click();
  await page.waitForTimeout(120);
  console.log('V32_STATS',JSON.stringify(await page.evaluate(()=>{
    const ov=document.querySelector('#cit-v18-stats');
    return {html:ov?.outerHTML.slice(0,5000)||'',children:ov?[...ov.children].map(el=>({tag:el.tagName,id:el.id,cls:el.className,transform:getComputedStyle(el).transform})) : []};
  })));
  await page.locator('.v18-stats-close').click();

  await page.locator('#v25-menu').click();
  await page.waitForTimeout(500);
  console.log('V32_SETTINGS',JSON.stringify(await page.evaluate(()=>{
    const visible=[...document.querySelectorAll('#g-cit div,#g-cit section,#g-cit aside,#g-cit nav,#g-cit dialog,[role="dialog"],[role="menu"]')].filter(el=>{
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      return cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>80&&r.height>40&&r.left<innerWidth&&r.right>0&&r.top<innerHeight&&r.bottom>0;
    }).map(el=>({tag:el.tagName,id:el.id||'',cls:typeof el.className==='string'?el.className:'',role:el.getAttribute('role')||'',text:(el.textContent||'').trim().slice(0,220),html:el.outerHTML.slice(0,1800),transform:getComputedStyle(el).transform}));
    return visible;
  })));

  console.log('V32_TOOLS',JSON.stringify(await page.evaluate(()=>[...document.querySelector('#cit-tools .v23-category-col').children].map(el=>({tag:el.tagName,id:el.id||'',cls:el.className||'',text:(el.textContent||'').trim(),html:el.outerHTML.slice(0,1000)})))));
  console.log('V32_DYNAMIC',JSON.stringify(await page.evaluate(()=>{
    let person=null;
    try{
      if(typeof citPersonEl==='function'){
        const el=citPersonEl('🙂');
        person={tag:el.tagName,id:el.id||'',cls:el.className||'',html:el.outerHTML.slice(0,1800)};
        el.remove();
      }
    }catch(e){person={error:String(e)}}
    const globals=Object.keys(window).filter(k=>/^cit/i.test(k)&&/(bus|person|citizen|thought|marker)/i.test(k)).sort();
    return {person,globals,busVehicle:typeof citBusVehicleEl==='function'?String(citBusVehicleEl).slice(0,5000):null,placePerson:typeof citPlacePerson==='function'?String(citPlacePerson).slice(0,3000):null};
  })));
});