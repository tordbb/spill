from pathlib import Path
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: inject-city-v2.py <html>')

html_path = Path(sys.argv[1])
root = Path(__file__).resolve().parent
html = html_path.read_text(encoding='utf-8')
css = (root / 'city-v2-responsive.css').read_text(encoding='utf-8')
css += '\n' + (root / 'city-v2-responsive-compact.css').read_text(encoding='utf-8')
css += '\n' + (root / 'city-v2-portrait-upright.css').read_text(encoding='utf-8')
css += '\n' + (root / 'city-v2-polish.css').read_text(encoding='utf-8')
js = (root / 'city-v2-responsive.js').read_text(encoding='utf-8')
js += '\n' + (root / 'city-v2-portrait-upright.js').read_text(encoding='utf-8')
js += '\n' + (root / 'city-v2-polish.js').read_text(encoding='utf-8')

if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')

# Older generated builds can still contain this direct tile mapper. Native /v2
# portrait removes the root transform, so the ordinary unrotated branch applies.
paint_pattern = re.compile(
    r"\s*const rotated=matchMedia\('\(orientation:portrait\)'\)\.matches\s*&&\s*getComputedStyle\(\$\('#g-cit'\)\)\.transform\s*!==\s*'none';"
    r"\s*const localX=rotated\s*\?\s*\(e\.clientY-r\.top\)\s*:\s*\(e\.clientX-r\.left\);"
    r"\s*const localY=rotated\s*\?\s*\(r\.right-e\.clientX\)\s*:\s*\(e\.clientY-r\.top\);"
)
paint_replacement = """
    const cityRoot=$('#g-cit');
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(cityRoot).transform!=='none';
    const localX=rotated ? (e.clientY-r.top) : (e.clientX-r.left);
    const localY=rotated ? (r.right-e.clientX) : (e.clientY-r.top);"""
html, paint_count = paint_pattern.subn(paint_replacement, html, count=1)

# Current stable builds use the camera patch's localOf() mapper. Physical pointer
# coordinates are ordinary viewport coordinates once /v2 portrait is native.
camera_pattern = re.compile(
    r"const localOf=e=>\{\s*const r=v\.getBoundingClientRect\(\);\s*"
    r"return rotated\(\)\s*\?\s*\{x:e\.clientY-r\.top,\s*y:r\.right-e\.clientX\}\s*"
    r":\s*\{x:e\.clientX-r\.left,\s*y:e\.clientY-r\.top\};\s*\};"
)
camera_replacement = """const localOf=e=>{
    const r=v.getBoundingClientRect();
    return rotated()
      ? {x:e.clientY-r.top,y:r.right-e.clientX}
      : {x:e.clientX-r.left,y:e.clientY-r.top};
  };"""
html, camera_count = camera_pattern.subn(camera_replacement, html, count=1)
if camera_count != 1:
    raise SystemExit('could not adapt stable camera pointer mapping')

# The native portrait board remaps logical 30x20 coordinates into a physical
# 20x30 footprint without rotating tile DOM. Invert that coordinate mapping for
# painting, roads, bus editing and every other camera-backed pointer action.
camera_cell_pattern = re.compile(
    r"const cellAt=p=>\{\s*"
    r"const worldX=\(p\.x-citCam\.x\)/citCam\.scale,\s*worldY=\(p\.y-citCam\.y\)/citCam\.scale;\s*"
    r"const c=Math\.floor\(worldX/citTs\),\s*rr=Math\.floor\(worldY/citTs\);\s*"
    r"if\(rr<0\|\|c<0\|\|rr>=CITY_CFG\.ROWS\|\|c>=CITY_CFG\.COLS\)return null;\s*"
    r"return citIdx\(rr,c\);\s*\};"
)
camera_cell_replacement = """const cellAt=p=>{
    const worldX=(p.x-citCam.x)/citCam.scale, worldY=(p.y-citCam.y)/citCam.scale;
    const cityRoot=$('#g-cit');
    const nativePortrait=cityRoot.classList.contains('v2-portrait') && getComputedStyle(cityRoot).transform==='none';
    let c,rr;
    if(nativePortrait){
      rr=Math.floor(worldX/citTs);
      c=CITY_CFG.COLS-1-Math.floor(worldY/citTs);
    }else{
      c=Math.floor(worldX/citTs);
      rr=Math.floor(worldY/citTs);
    }
    if(rr<0||c<0||rr>=CITY_CFG.ROWS||c>=CITY_CFG.COLS)return null;
    return citIdx(rr,c);
  };"""
html, camera_cell_count = camera_cell_pattern.subn(camera_cell_replacement, html, count=1)
if camera_cell_count != 1:
    raise SystemExit('could not adapt stable camera cell mapping')

# Building double-click starts with the same physical viewport coordinates.
interior_pattern = re.compile(
    r"\s*const rotated=matchMedia\('\(orientation:portrait\)'\)\.matches\s*&&\s*getComputedStyle\(document\.getElementById\('g-cit'\)\)\.transform\s*!==\s*'none';"
    r"\s*const local=rotated\?\{x:e\.clientY-r\.top,y:r\.right-e\.clientX\}:\{x:e\.clientX-r\.left,y:e\.clientY-r\.top\};"
)
interior_replacement = """
    const cityRoot=document.getElementById('g-cit');
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(cityRoot).transform!=='none';
    const local=rotated?{x:e.clientY-r.top,y:r.right-e.clientX}:{x:e.clientX-r.left,y:e.clientY-r.top};"""
html, interior_count = interior_pattern.subn(interior_replacement, html, count=1)
if interior_count != 1:
    raise SystemExit('could not adapt stable interior tile pointer mapping')

interior_cell_pattern = re.compile(
    r"const worldX=\(local\.x-citCam\.x\)/citCam\.scale,worldY=\(local\.y-citCam\.y\)/citCam\.scale;\s*"
    r"const c=Math\.floor\(worldX/citTs\),rr=Math\.floor\(worldY/citTs\);\s*"
    r"if\(rr<0\|\|c<0\|\|rr>=CITY_CFG\.ROWS\|\|c>=CITY_CFG\.COLS\)return null;\s*"
    r"return rr\*CITY_CFG\.COLS\+c;"
)
interior_cell_replacement = """const worldX=(local.x-citCam.x)/citCam.scale,worldY=(local.y-citCam.y)/citCam.scale;
    const nativePortrait=cityRoot.classList.contains('v2-portrait') && getComputedStyle(cityRoot).transform==='none';
    let c,rr;
    if(nativePortrait){
      rr=Math.floor(worldX/citTs);
      c=CITY_CFG.COLS-1-Math.floor(worldY/citTs);
    }else{
      c=Math.floor(worldX/citTs);
      rr=Math.floor(worldY/citTs);
    }
    if(rr<0||c<0||rr>=CITY_CFG.ROWS||c>=CITY_CFG.COLS)return null;
    return rr*CITY_CFG.COLS+c;"""
html, interior_cell_count = interior_cell_pattern.subn(interior_cell_replacement, html, count=1)
if interior_cell_count != 1:
    raise SystemExit('could not adapt stable interior cell mapping')

# Interior dragging is native/upright when the city root has no portrait transform.
canvas_pattern = re.compile(
    r"\s*const c=document\.getElementById\('ci-canvas'\),r=c\.getBoundingClientRect\(\);"
    r"\s*return \{x:\(e\.clientX-r\.left\)/Math\.max\(1,r\.width\)\*100,y:\(e\.clientY-r\.top\)/Math\.max\(1,r\.height\)\*100\};"
)
canvas_replacement = """
    const c=document.getElementById('ci-canvas'),r=c.getBoundingClientRect();
    const cityRoot=document.getElementById('g-cit');
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(cityRoot).transform!=='none';
    const x=rotated?(e.clientY-r.top):(e.clientX-r.left);
    const y=rotated?(r.right-e.clientX):(e.clientY-r.top);
    return {x:x/Math.max(1,rotated?r.height:r.width)*100,y:y/Math.max(1,rotated?r.width:r.height)*100};"""
html, canvas_count = canvas_pattern.subn(canvas_replacement, html, count=1)
if canvas_count != 1:
    raise SystemExit('could not adapt stable interior canvas pointer mapping')

# Keep the stable landscape fitter free of its old duplicate portrait reserve.
# Native portrait is fitted later by city-v2-portrait-upright.js using the real
# middle grid track rather than side-panel assumptions.
fit_pattern = re.compile(
    r"\s*const topReserve=Math\.max\(70,\s*help\?\(help\.offsetTop\+help\.offsetHeight\+8\):70\);"
    r"\s*const byW=Math\.floor\(\(vw\s*-\s*68\s*-\s*sideW\s*-\s*24\)\s*/\s*CITY_CFG\.COLS\);"
    r"\s*const byH=Math\.floor\(\(vh\s*-\s*topReserve\s*-\s*6\)\s*/\s*CITY_CFG\.ROWS\);"
)
fit_replacement = """
  const topReserve=Math.max(0, help?(help.offsetTop+help.offsetHeight+8):0);
  const byW=Math.floor((vw - sideW - 20) / CITY_CFG.COLS);
  const byH=Math.floor((vh - 14) / CITY_CFG.ROWS);"""
html, fit_count = fit_pattern.subn(fit_replacement, html, count=1)

# The v18 stats dialog previously treated a dwelling as existing only when it
# was connected to the road network. That under-counted real vacant houses.
# Capacity for homes is physical housing stock: every H/M tile counts, while
# occupancy is still derived from unique current household home indices.
stats_home_pattern = re.compile(
    r"const homeTiles = \[\];\s*"
    r"cit\.g\.forEach\(\(t,i\)=>\{\s*if \(\(t==='H'\|\|t==='M'\) && citConnected\(i,act\)\) homeTiles\.push\(i\);\s*\}\);"
)
stats_home_replacement = """const homeTiles = [];
    cit.g.forEach((t,i)=>{ if (t==='H'||t==='M') homeTiles.push(i); });"""
html, stats_home_count = stats_home_pattern.subn(stats_home_replacement, html, count=1)
if stats_home_count != 1:
    raise SystemExit('could not correct v2 housing stats')

print(
    'v2 generated adaptations: '
    f'paint={paint_count} camera={camera_count} camera_cell={camera_cell_count} '
    f'interior={interior_count} interior_cell={interior_cell_count} '
    f'canvas={canvas_count} fit={fit_count} stats_home={stats_home_count}'
)

head = f'\n<style id="city-v2-responsive-style">\n{css}\n</style>\n'
body = f'\n<script id="city-v2-responsive-script">\n{js}\n</script>\n'
html = html.replace('</head>', head + '</head>', 1)
html = html.replace('</body>', body + '</body>', 1)
html_path.write_text(html, encoding='utf-8')
