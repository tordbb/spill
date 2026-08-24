#!/usr/bin/env python3
from pathlib import Path
import html as h
import sys

if len(sys.argv)!=5:
    raise SystemExit('usage: inject-new-pages-v31.py <html> <role> <target> <slug>')
target_path=Path(sys.argv[1])
role,target,slug=sys.argv[2:5]
root=Path(__file__).resolve().parent
text=target_path.read_text(encoding='utf-8')
if 'new-pages-v31-script' in text:
    raise SystemExit('new v31 shell already injected')
css=(root/'new-pages-v31.css').read_text(encoding='utf-8')
js=(root/'new-pages-v31.js').read_text(encoding='utf-8')
tag=f'<script id="new-pages-v31-script" data-role="{h.escape(role)}" data-target="{h.escape(target)}" data-slug="{h.escape(slug)}">\n{js}\n</script>'
text=text.replace('</head>',f'\n<style id="new-pages-v31-style">\n{css}\n</style>\n</head>',1)
text=text.replace('</body>',f'\n{tag}\n</body>',1)
target_path.write_text(text,encoding='utf-8')
