#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

MARKER = 'city-stable-guidance-v22-script'
SILENT_MARKER = 'site-silent-v23-script'
SUDOKU10_MARKER = 'sudoku-10x10-v24-script'
BENCH_TOKEN = '__BENCH__'
CHAIR = '\U0001FA91'
MAIN_STYLE_MARKER = 'city-main-responsive-style'
MAIN_SCRIPT_MARKER = 'city-main-responsive-script'
V2_STYLE_MARKER = 'city-v2-responsive-style'
V2_SCRIPT_MARKER = 'city-v2-responsive-script'


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit('usage: inject-stable-city-v22.py <index.html>')

    target = Path(sys.argv[1])
    html = target.read_text(encoding='utf-8')

    # The stable city must not contain or render the Unicode chair glyph. The
    # root-only JS overlay turns this neutral token into the shared bench art.
    html = html.replace(CHAIR, BENCH_TOKEN)

    scripts = []
    if MARKER not in html:
        js = Path(__file__).with_name('city-stable-guidance-v22.js').read_text(encoding='utf-8')
        scripts.append(f'\n<script id="{MARKER}">\n{js}\n</script>\n')
    if SILENT_MARKER not in html:
        js = Path(__file__).with_name('site-silent-v23.js').read_text(encoding='utf-8')
        scripts.append(f'\n<script id="{SILENT_MARKER}">\n{js}\n</script>\n')
    if SUDOKU10_MARKER not in html:
        js = Path(__file__).with_name('sudoku-10x10-v24.js').read_text(encoding='utf-8')
        scripts.append(f'\n<script id="{SUDOKU10_MARKER}">\n{js}\n</script>\n')

    if scripts:
        if '</body>' not in html:
            raise SystemExit('could not find </body> in target')
        html = html.replace('</body>', ''.join(scripts) + '</body>', 1)

    if CHAIR in html:
        raise SystemExit('chair glyph remains in stable city build')
    if BENCH_TOKEN not in html:
        raise SystemExit('bench token was not installed in stable city build')
    if SILENT_MARKER not in html:
        raise SystemExit('silent-mode overlay was not installed in stable build')
    if SUDOKU10_MARKER not in html:
        raise SystemExit('10x10 Sudoku overlay was not installed in stable build')

    target.write_text(html, encoding='utf-8')

    # The /v2 responsive redesign has completed browser and visual verification.
    # Promote that exact generated adapter to the normal root build. Use distinct
    # main markers so the existing build guard can still distinguish root from
    # the mirrored /v2 artifact.
    adapter = Path(__file__).with_name('inject-city-v2.py')
    subprocess.run([sys.executable, str(adapter), str(target)], check=True)
    html = target.read_text(encoding='utf-8')
    if V2_STYLE_MARKER not in html or V2_SCRIPT_MARKER not in html:
        raise SystemExit('responsive city promotion did not install expected markers')
    html = html.replace(V2_STYLE_MARKER, MAIN_STYLE_MARKER, 1)
    html = html.replace(V2_SCRIPT_MARKER, MAIN_SCRIPT_MARKER, 1)
    target.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    main()
