#!/usr/bin/env python3
from pathlib import Path
import re,sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
needles=[
 'Bygg dyret så alle delene passer',
 'nav-home',
 'Avslutt spill',
 'renderHome',
 'home-grid',
 'home-card',
 'card-grid',
 'g-puzzle',
 'g-build',
 '🎨',
 '⏬',
 '.menu-grid',
 '#card-cit',
 'card-cit',
 'function citSetThought',
 '.cit-thought',
 'citNoteNeed',
]
for needle in needles:
    print('\n===',needle,'===')
    hits=[m.start() for m in re.finditer(re.escape(needle),s)]
    print('hits',len(hits))
    for i in hits[:6]:
        a=max(0,i-900);b=min(len(s),i+1400)
        print(s[a:b].replace('\n','\\n'))
        print('---')
