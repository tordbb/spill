#!/usr/bin/env python3
from pathlib import Path
import sys

MARKER = 'city-stable-guidance-v22-script'
BENCH_TOKEN = '__BENCH__'
CHAIR = '\U0001FA91'


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit('usage: inject-stable-city-v22.py <index.html>')

    target = Path(sys.argv[1])
    html = target.read_text(encoding='utf-8')
    if MARKER in html:
        return

    # The stable city must not contain or render the Unicode chair glyph. The
    # root-only JS overlay turns this neutral token into the shared bench art.
    html = html.replace(CHAIR, BENCH_TOKEN)

    js = Path(__file__).with_name('city-stable-guidance-v22.js').read_text(encoding='utf-8')
    script = f'\n<script id="{MARKER}">\n{js}\n</script>\n'
    if '</body>' not in html:
        raise SystemExit('could not find </body> in target')
    html = html.replace('</body>', script + '</body>', 1)

    if CHAIR in html:
        raise SystemExit('chair glyph remains in stable city build')
    if BENCH_TOKEN not in html:
        raise SystemExit('bench token was not installed in stable city build')

    target.write_text(html, encoding='utf-8')


if __name__ == '__main__':
    main()
