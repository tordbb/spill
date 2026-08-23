from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: inject-v23.py <html>')

html_path = Path(sys.argv[1])
root = Path(__file__).resolve().parent
css = (root / 'city-visual-v23.css').read_text(encoding='utf-8')
js = (root / 'city-visual-v23.js').read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')
if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')
if 'city-visual-v23-script' in html:
    raise SystemExit('v23 already injected')
html = html.replace('</head>', f'\n<style id="city-visual-v23">\n{css}\n</style>\n</head>', 1)
html = html.replace('</body>', f'\n<script id="city-visual-v23-script">\n{js}\n</script>\n</body>', 1)
html_path.write_text(html, encoding='utf-8')
