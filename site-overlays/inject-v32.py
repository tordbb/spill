#!/usr/bin/env python3
from pathlib import Path
import sys

MARKER='city-visual-v32-script'
if len(sys.argv)!=2:
    raise SystemExit('usage: inject-v32.py <html>')
target=Path(sys.argv[1])
root=Path(__file__).resolve().parent
html=target.read_text(encoding='utf-8')
if MARKER in html:
    raise SystemExit('v32 already injected')
css=(root/'city-visual-v32.css').read_text(encoding='utf-8')
js=(root/'city-visual-v32.js').read_text(encoding='utf-8')
html=html.replace('</head>',f'\n<style id="city-visual-v32">\n{css}\n</style>\n</head>',1)
html=html.replace('</body>',f'\n<script id="{MARKER}">\n{js}\n</script>\n</body>',1)
target.write_text(html,encoding='utf-8')
