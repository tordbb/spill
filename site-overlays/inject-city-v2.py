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
js = (root / 'city-v2-responsive.js').read_text(encoding='utf-8')

if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')

# Older generated builds can still contain this direct tile mapper. The corrected
# v2 portrait orientation now follows the stable +90deg screen transform, so its
# inverse is the same clientY/right-edge mapping used by stable portrait.
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

# Current stable builds use the camera patch's localOf() mapper. Keep the stable
# portrait inverse explicitly in the generated /v2 copy so camera hit-testing
# remains tied to the corrected visual rotation.
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

# Building double-click hit-testing uses the same inverse transform as the camera.
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

# Interior dragging starts from an unrotated canvas mapper, so explicitly invert
# the corrected portrait transform and account for the swapped physical bounds.
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

# The stable fitter used large fixed reserves for its previous portrait layout.
# When that legacy calculation is still present, remove the duplicate reserve;
# v2 itself measures visualViewport and the actual tool/status columns.
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

print(f'v2 generated adaptations: paint={paint_count} camera={camera_count} interior={interior_count} canvas={canvas_count} fit={fit_count}')

head = f'\n<style id="city-v2-responsive-style">\n{css}\n</style>\n'
body = f'\n<script id="city-v2-responsive-script">\n{js}\n</script>\n'
html = html.replace('</head>', head + '</head>', 1)
html = html.replace('</body>', body + '</body>', 1)
html_path.write_text(html, encoding='utf-8')
