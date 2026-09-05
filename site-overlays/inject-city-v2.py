from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: inject-city-v2.py <html>')

html_path = Path(sys.argv[1])
root = Path(__file__).resolve().parent
html = html_path.read_text(encoding='utf-8')
css = (root / 'city-v2-responsive.css').read_text(encoding='utf-8')
js = (root / 'city-v2-responsive.js').read_text(encoding='utf-8')

if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')

# Stable city painting was written for the old clockwise portrait transform.
# /v2 rotates the complete city counterclockwise, so invert physical pointer
# coordinates accordingly. This replacement is deliberately limited to /v2's
# generated copy and does not alter the stable root.
old_paint = """    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle($('#g-cit')).transform!=='none';
    const localX=rotated ? (e.clientY-r.top) : (e.clientX-r.left);
    const localY=rotated ? (r.right-e.clientX) : (e.clientY-r.top);"""
new_paint = """    const cityRoot=$('#g-cit');
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(cityRoot).transform!=='none';
    const ccw=rotated && cityRoot.classList.contains('v2-portrait');
    const localX=ccw ? (r.bottom-e.clientY) : rotated ? (e.clientY-r.top) : (e.clientX-r.left);
    const localY=ccw ? (e.clientX-r.left) : rotated ? (r.right-e.clientX) : (e.clientY-r.top);"""
if old_paint not in html:
    raise SystemExit('could not find stable city paint pointer mapping')
html = html.replace(old_paint, new_paint, 1)

# Building double-click hit-testing uses the same old clockwise mapping.
old_interior_cell = """    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(document.getElementById('g-cit')).transform!=='none';
    const local=rotated?{x:e.clientY-r.top,y:r.right-e.clientX}:{x:e.clientX-r.left,y:e.clientY-r.top};"""
new_interior_cell = """    const cityRoot=document.getElementById('g-cit');
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(cityRoot).transform!=='none';
    const ccw=rotated && cityRoot.classList.contains('v2-portrait');
    const local=ccw?{x:r.bottom-e.clientY,y:e.clientX-r.left}:rotated?{x:e.clientY-r.top,y:r.right-e.clientX}:{x:e.clientX-r.left,y:e.clientY-r.top};"""
if old_interior_cell not in html:
    raise SystemExit('could not find stable interior tile pointer mapping')
html = html.replace(old_interior_cell, new_interior_cell, 1)

# Interior dragging also needs coordinates in the counterclockwise local system.
old_canvas = """    const c=document.getElementById('ci-canvas'),r=c.getBoundingClientRect();
    return {x:(e.clientX-r.left)/Math.max(1,r.width)*100,y:(e.clientY-r.top)/Math.max(1,r.height)*100};"""
new_canvas = """    const c=document.getElementById('ci-canvas'),r=c.getBoundingClientRect();
    const cityRoot=document.getElementById('g-cit');
    const ccw=matchMedia('(orientation:portrait)').matches && cityRoot.classList.contains('v2-portrait') && getComputedStyle(cityRoot).transform!=='none';
    const x=ccw?(r.bottom-e.clientY):(e.clientX-r.left);
    const y=ccw?(e.clientX-r.left):(e.clientY-r.top);
    return {x:x/Math.max(1,ccw?r.height:r.width)*100,y:y/Math.max(1,ccw?r.width:r.height)*100};"""
if old_canvas not in html:
    raise SystemExit('could not find stable interior canvas pointer mapping')
html = html.replace(old_canvas, new_canvas, 1)

# The stable fitter intentionally left large portrait/browser-chrome reserves.
# /v2 measures the dynamic visual viewport itself, so use the actual remaining
# stage space after the tool/status columns instead of subtracting those old
# fixed reserves a second time.
old_fit = """  const topReserve=Math.max(70, help?(help.offsetTop+help.offsetHeight+8):70);
  const byW=Math.floor((vw - 68 - sideW - 24) / CITY_CFG.COLS);
  const byH=Math.floor((vh - topReserve - 6) / CITY_CFG.ROWS);"""
new_fit = """  const topReserve=Math.max(0, help?(help.offsetTop+help.offsetHeight+8):0);
  const byW=Math.floor((vw - sideW - 20) / CITY_CFG.COLS);
  const byH=Math.floor((vh - 14) / CITY_CFG.ROWS);"""
if old_fit not in html:
    raise SystemExit('could not find stable city board fitting calculation')
html = html.replace(old_fit, new_fit, 1)

head = f'\n<style id="city-v2-responsive-style">\n{css}\n</style>\n'
body = f'\n<script id="city-v2-responsive-script">\n{js}\n</script>\n'
html = html.replace('</head>', head + '</head>', 1)
html = html.replace('</body>', body + '</body>', 1)
html_path.write_text(html, encoding='utf-8')
