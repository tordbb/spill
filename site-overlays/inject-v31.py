#!/usr/bin/env python3
from pathlib import Path
import sys
MARKER='city-visual-v31-script'
if len(sys.argv)!=2:
    raise SystemExit('usage: inject-v31.py <html>')
target=Path(sys.argv[1])
root=Path(__file__).resolve().parent
html=target.read_text(encoding='utf-8')
if MARKER in html:
    raise SystemExit('v31 already injected')
css=(root/'city-visual-v31.css').read_text(encoding='utf-8')
js=(root/'city-visual-v31.js').read_text(encoding='utf-8')
html=html.replace('</head>',f'\n<style id="city-visual-v31">\n{css}\n</style>\n</head>',1)
html=html.replace('</body>',f'\n<script id="{MARKER}">\n{js}\n</script>\n</body>',1)
target.write_text(html,encoding='utf-8')
