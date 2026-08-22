from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: inject-v21.py <html>')

html_path = Path(sys.argv[1])
root = Path(__file__).resolve().parent
css = (root / 'city-visual-v21.css').read_text(encoding='utf-8')
js = (root / 'city-visual-v21.js').read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')
if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')
html = html.replace('</head>', f'\n<style id="city-visual-v21">\n{css}\n</style>\n</head>', 1)
html = html.replace('</body>', f'\n<script id="city-visual-v21-script">\n{js}\n</script>\n</body>', 1)
html_path.write_text(html, encoding='utf-8')
