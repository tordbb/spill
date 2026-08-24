#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv)!=3:
    raise SystemExit('usage: verify-v28.py <stable-root-html> <new-html>')

stable=Path(sys.argv[1]).read_text(encoding='utf-8')
new=Path(sys.argv[2]).read_text(encoding='utf-8')

def need(haystack,needle,label):
    if needle not in haystack:
        raise SystemExit(f'MISSING {label}: {needle}')

def forbid(haystack,needle,label):
    if needle in haystack:
        raise SystemExit(f'LEAK {label}: {needle}')

# v28 must remain isolated to /new.
need(new,'city-visual-v28-script','v28 injection')
forbid(stable,'city-visual-v28-script','v28 stable-root isolation')

# These are the invariants that previously regressed after category re-renders or small viewports.
for marker in [
    'MAX_CONTENT_SLOTS=7',
    '__cityV28Audit',
    '__v28ButtonSoundMute',
    'v28-road-network',
    'v28-edit-actions',
    'v28-moon-cue',
    'v28-fallback-open',
    'v28-tool-overflow',
]:
    need(new,marker,marker)

# v28 must be last among city visual layers so it can own the final DOM invariants.
order=[new.find(f'city-visual-v{n}-script') for n in (23,24,25,26,27,28)]
if any(i<0 for i in order) or order!=sorted(order):
    raise SystemExit(f'wrong visual injection order: {order}')

print('v28 static invariants: OK')
