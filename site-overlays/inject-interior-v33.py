from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit('usage: inject-interior-v33.py <html>')

html_path = Path(sys.argv[1])
root = Path(__file__).resolve().parent
css = (root / 'city-interior-v33.css').read_text()
js = (root / 'city-interior-v33.js').read_text()
html = html_path.read_text()
marker = '</body>'
payload = f'\n<style id="city-interior-v33-style">\n{css}\n</style>\n<script id="city-interior-v33-script">\n{js}\n</script>\n'
if 'city-interior-v33-script' in html:
    raise SystemExit('city-interior-v33 already injected')
if marker not in html:
    raise SystemExit('missing </body> marker')
html_path.write_text(html.replace(marker, payload + marker, 1))
