from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: inject-cave-v2.py <html> <home|game>')

html_path = Path(sys.argv[1])
mode = sys.argv[2]
if mode not in ('home', 'game'):
    raise SystemExit('mode must be home or game')

html = html_path.read_text(encoding='utf-8')
if '</head>' not in html or '</body>' not in html:
    raise SystemExit('expected closing head/body tags')

if mode == 'home':
    css = r'''
#card-cave {
  background:linear-gradient(145deg,#284b63,#102a3a);
  color:#fff;
  overflow:hidden;
}
#card-cave::before,
#card-cave::after {
  content:'';
  position:absolute;
  width:48%;
  height:35%;
  bottom:-8%;
  background:#1a2e35;
  border-radius:60% 60% 0 0;
  opacity:.9;
  pointer-events:none;
}
#card-cave::before { left:-12%; transform:rotate(18deg); }
#card-cave::after { right:-12%; transform:rotate(-18deg); }
#card-cave .cave-ship { position:relative; z-index:1; filter:drop-shadow(0 3px 2px #0005); }
#card-cave .mini { position:relative; z-index:1; }
'''
    js = r'''
(() => {
  'use strict';
  const grid = document.querySelector('#home .menu-grid');
  if (!grid || document.getElementById('card-cave')) return;

  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'menu-card';
  card.id = 'card-cave';
  card.setAttribute('aria-label', 'Cave Flight');
  card.innerHTML = '<span class="cave-ship">🚀</span><span class="mini">⛰️ ✨ ⛰️</span>';
  card.addEventListener('click', () => {
    window.location.href = new URL('cave/', window.location.href).href;
  });
  grid.appendChild(card);
})();
'''
    html = html.replace('</head>', f'\n<style id="cave-launcher-style">\n{css}\n</style>\n</head>', 1)
    html = html.replace('</body>', f'\n<script id="cave-launcher-card">\n{js}\n</script>\n</body>', 1)
else:
    css = r'''
* {
  -webkit-tap-highlight-color: transparent !important;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}
#game { outline:none; }
#cave-home {
  position:fixed;
  top:max(12px, env(safe-area-inset-top));
  left:max(12px, env(safe-area-inset-left));
  z-index:20;
  width:52px;
  height:52px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:17px;
  background:#061019cc;
  border:1px solid #9cc8da55;
  box-shadow:0 3px 10px #0006;
  color:#fff;
  text-decoration:none;
  font-size:28px;
  line-height:1;
  touch-action:manipulation;
}
#cave-home:active { transform:scale(.94); }
'''
    home = '<a id="cave-home" href="../" aria-label="Back to home">🏡</a>'
    js = r'''
(() => {
  'use strict';
  const home = document.getElementById('cave-home');
  if (!home) return;
  home.addEventListener('pointerdown', (event) => event.stopPropagation());
  home.addEventListener('click', (event) => event.stopPropagation());
})();
'''
    html = html.replace('</head>', f'\n<style id="cave-v2-ui">\n{css}\n</style>\n</head>', 1)
    html = html.replace('<body>', f'<body>\n{home}', 1)
    html = html.replace('</body>', f'\n<script id="cave-v2-navigation">\n{js}\n</script>\n</body>', 1)

html_path.write_text(html, encoding='utf-8')
