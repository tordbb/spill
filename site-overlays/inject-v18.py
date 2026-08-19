from pathlib import Path
import sys

if len(sys.argv) not in (2, 3):
    raise SystemExit('usage: inject-v18.py <html> [root|parallel]')

html_path = Path(sys.argv[1])
mode = sys.argv[2] if len(sys.argv) == 3 else 'parallel'
if mode not in ('root', 'parallel'):
    raise SystemExit('mode must be root or parallel')

root = Path(__file__).resolve().parent
css = (root / 'city-functional-v18.css').read_text(encoding='utf-8')
js = (root / 'city-functional-v18.js').read_text(encoding='utf-8')

# The parallel /new version intentionally has its own local save. When v18 is promoted
# to the normal URL, keep the game's existing save function and storage untouched.
if mode == 'root':
    marker = '  /* Keep /new isolated from the existing game while seeding it from the current save once. */'
    after = '\n\n  if (!Array.isArray(S.v18CurrentNeeds))'
    start = js.find(marker)
    end = js.find(after, start)
    if start < 0 or end < 0:
        raise SystemExit('could not locate parallel-save block in v18 script')
    js = js[:start] + '  /* Normal deployment: preserve the existing save storage and save() implementation. */' + js[end:]

html = html_path.read_text(encoding='utf-8')
if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')
html = html.replace('</head>', f'\n<style id="city-functional-v18">\n{css}\n</style>\n</head>', 1)
html = html.replace('</body>', f'\n<script id="city-functional-v18-script">\n{js}\n</script>\n</body>', 1)
html_path.write_text(html, encoding='utf-8')
