#!/usr/bin/env python3
from pathlib import Path
import sys

MARKER = 'city-stable-guidance-v22-script'
SILENT_MARKER = 'site-silent-v23-script'
BENCH_TOKEN = '__BENCH__'
CHAIR = '\U0001FA91'


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

    target.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    main()
