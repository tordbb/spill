from pathlib import Path
import json
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
    source_root = Path(__file__).resolve().parent.parent
    cake_html = (source_root / 'cake' / 'index.html').read_text(encoding='utf-8')
    cake_js = (source_root / 'cake' / 'game.js').read_text(encoding='utf-8')
    cake_html = cake_html.replace('<script src="game.js"></script>', f'<script>\n{cake_js}\n</script>')
    cake_doc = json.dumps(cake_html, ensure_ascii=False).replace('</script>', '<\\/script>')

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
#card-cake {
  background:linear-gradient(145deg,#6a304f,#37203f);
  color:#fff;
  overflow:hidden;
}
#card-cake::before {
  content:'';
  position:absolute;
  inset:auto 8% 8% 8%;
  height:28%;
  background:repeating-linear-gradient(90deg,#ff6b8a 0 18%,#ffb347 18% 36%,#ffe169 36% 54%,#72d6a8 54% 72%,#63b9ff 72% 90%,#a98bff 90% 100%);
  border-radius:9px;
  opacity:.72;
  box-shadow:0 3px 0 #b7744f;
  pointer-events:none;
}
#card-cake .cake-icon { position:relative; z-index:1; filter:drop-shadow(0 3px 2px #0005); }
#card-cake .mini { position:relative; z-index:1; }
#cake-game-frame {
  position:fixed;
  inset:0;
  z-index:100000;
  width:100vw;
  height:100dvh;
  border:0;
  background:#180f20;
}
'''
    js = rf'''
(() => {{
  'use strict';
  const grid = document.querySelector('#home .menu-grid');
  if (!grid) return;

  if (!document.getElementById('card-cave')) {{
    const cave = document.createElement('button');
    cave.type = 'button';
    cave.className = 'menu-card';
    cave.id = 'card-cave';
    cave.setAttribute('aria-label', 'Cave Flight');
    cave.innerHTML = '<span class="cave-ship">🚀</span><span class="mini">⛰️ ✨ ⛰️</span>';
    cave.addEventListener('click', () => {{
      window.location.href = new URL('cave/', window.location.href).href;
    }});
    grid.appendChild(cave);
  }}

  if (!document.getElementById('card-cake')) {{
    const cake = document.createElement('button');
    cake.type = 'button';
    cake.className = 'menu-card';
    cake.id = 'card-cake';
    cake.setAttribute('aria-label', 'Kakefall');
    cake.innerHTML = '<span class="cake-icon">🍰</span><span class="mini">▦ ▣ ▦</span>';
    cake.addEventListener('click', () => {{
      if (document.getElementById('cake-game-frame')) return;
      const frame = document.createElement('iframe');
      frame.id = 'cake-game-frame';
      frame.title = 'Kakefall';
      frame.setAttribute('allow', 'fullscreen');
      frame.srcdoc = {cake_doc};
      document.body.appendChild(frame);
      document.body.style.overflow = 'hidden';
    }});
    grid.appendChild(cake);
  }}

  window.addEventListener('message', (event) => {{
    if (!event.data || event.data.type !== 'spill-cake-close') return;
    const frame = document.getElementById('cake-game-frame');
    if (frame && event.source === frame.contentWindow) {{
      frame.remove();
      document.body.style.overflow = '';
    }}
  }});
}})();
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
