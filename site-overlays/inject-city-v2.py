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

# Older generated builds had an inline tile mapper written specifically for the
# old clockwise portrait transform. Later camera patches can replace that block,
# so update it when present without making the v2 build depend on one old source
# spelling. The browser regression still verifies real portrait hit-testing.
paint_pattern = re.compile(
    r"\s*const rotated=matchMedia\('\(orientation:portrait\)'\)\.matches\s*&&\s*getComputedStyle\(\$\('#g-cit'\)\)\.transform\s*!==\s*'none';"
    r"\s*const localX=rotated\s*\?\s*\(e\.clientY-r\.top\)\s*:\s*\(e\.clientX-r\.left\);"
    r"\s*const localY=rotated\s*\?\s*\(r\.right-e\.clientX\)\s*:\s*\(e\.clientY-r\.top\);"
)
paint_replacement = """
    const cityRoot=$('#g-cit');
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(cityRoot).transform!=='none';
    const ccw=rotated && cityRoot.classList.contains('v2-portrait');
    const localX=ccw ? (r.bottom-e.clientY) : rotated ? (e.clientY-r.top) : (e.clientX-r.left);
    const localY=ccw ? (e.clientX-r.left) : rotated ? (r.right-e.clientX) : (e.clientY-r.top);"""
html, paint_count = paint_pattern.subn(paint_replacement, html, count=1)

# Building double-click hit-testing is part of the stable v33 overlay and uses
# the old clockwise mapping until this v2-only generated copy is adapted.
interior_pattern = re.compile(
    r"\s*const rotated=matchMedia\('\(orientation:portrait\)'\)\.matches\s*&&\s*getComputedStyle\(document\.getElementById\('g-cit'\)\)\.transform\s*!==\s*'none';"
    r"\s*const local=rotated\?\{x:e\.clientY-r\.top,y:r\.right-e\.clientX\}:\{x:e\.clientX-r\.left,y:e\.clientY-r\.top\};"
)
interior_replacement = """
    const cityRoot=document.getElementById('g-cit');
    const rotated=matchMedia('(orientation:portrait)').matches && getComputedStyle(cityRoot).transform!=='none';
    const ccw=rotated && cityRoot.classList.contains('v2-portrait');
    const local=ccw?{x:r.bottom-e.clientY,y:e.clientX-r.left}:rotated?{x:e.clientY-r.top,y:r.right-e.clientX}:{x:e.clientX-r.left,y:e.clientY-r.top};"""
html, interior_count = interior_pattern.subn(interior_replacement, html, count=1)
if interior_count != 1:
    raise SystemExit('could not adapt stable interior tile pointer mapping')

# Interior dragging also needs coordinates in the counterclockwise local system.
canvas_pattern = re.compile(
    r"\s*const c=document\.getElementById\('ci-canvas'\),r=c\.getBoundingClientRect\(\);"
    r"\s*return \{x:\(e\.clientX-r\.left\)/Math\.max\(1,r\.width\)\*100,y:\(e\.clientY-r\.top\)/Math\.max\(1,r\.height\)\*100\};"
)
canvas_replacement = """
    const c=document.getElementById('ci-canvas'),r=c.getBoundingClientRect();
    const cityRoot=document.getElementById('g-cit');
    const ccw=matchMedia('(orientation:portrait)').matches && cityRoot.classList.contains('v2-portrait') && getComputedStyle(cityRoot).transform!=='none';
    const x=ccw?(r.bottom-e.clientY):(e.clientX-r.left);
    const y=ccw?(e.clientX-r.left):(e.clientY-r.top);
    return {x:x/Math.max(1,ccw?r.height:r.width)*100,y:y/Math.max(1,ccw?r.width:r.height)*100};"""
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

# Temporary CI trace: locate the later camera-patch mapper that supersedes the
# older paint block above. Keep the output compact and restricted to city-camera
# coordinate code so the exact generated spelling can be adapted safely.
seen = 0
for m in re.finditer(r'.{0,260}clientX.{0,700}', html, re.S):
    snippet = m.group(0)
    if ('citCam' in snippet or 'citTs' in snippet) and ('pointer' in snippet.lower() or 'cell' in snippet.lower() or 'world' in snippet.lower()):
        print('V2_CAMERA_MAPPER', re.sub(r'\s+', ' ', snippet)[:1100])
        seen += 1
        if seen >= 8:
            break

# Expose which generated variants were adapted for CI/debugging without changing
# runtime behavior. The required v33 mappings above must always be present.
print(f'v2 generated adaptations: paint={paint_count} interior={interior_count} canvas={canvas_count} fit={fit_count}')

head = f'\n<style id="city-v2-responsive-style">\n{css}\n</style>\n'
body = f'\n<script id="city-v2-responsive-script">\n{js}\n</script>\n'
html = html.replace('</head>', head + '</head>', 1)
html = html.replace('</body>', body + '</body>', 1)
html_path.write_text(html, encoding='utf-8')
