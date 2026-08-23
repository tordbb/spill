#!/usr/bin/env python3
from pathlib import Path
import sys

MARKER='city-visual-v24-script'

if len(sys.argv)!=2:
    raise SystemExit('usage: inject-v24.py <html>')

target=Path(sys.argv[1])
root=Path(__file__).resolve().parent
html=target.read_text(encoding='utf-8')
if MARKER in html:
    raise SystemExit('v24 already injected')
css=(root/'city-visual-v24.css').read_text(encoding='utf-8')
js=(root/'city-visual-v24.js').read_text(encoding='utf-8')
if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')
html=html.replace('</head>',f'\n<style id="city-visual-v24">\n{css}\n</style>\n</head>',1)
html=html.replace('</body>',f'\n<script id="{MARKER}">\n{js}\n</script>\n</body>',1)
target.write_text(html,encoding='utf-8')
