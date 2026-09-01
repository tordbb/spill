#!/usr/bin/env python3
from pathlib import Path
import sys

MARKER='site-silent-v23-script'


def main() -> None:
    if len(sys.argv)!=2:
        raise SystemExit('usage: inject-site-silent-v23.py <index.html>')

    target=Path(sys.argv[1])
    html=target.read_text(encoding='utf-8')
    if MARKER in html:
        return

    js=Path(__file__).with_name('site-silent-v23.js').read_text(encoding='utf-8')
    script=f'\n<script id="{MARKER}">\n{js}\n</script>\n'
    if '</body>' not in html:
        raise SystemExit('could not find </body> in target')
    html=html.replace('</body>',script+'</body>',1)
    target.write_text(html,encoding='utf-8')


if __name__=='__main__':
    main()
