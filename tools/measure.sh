#!/bin/bash
# Замер вёрстки в headless Chrome: переполнение, наложения, обрезки.
set -e
SRC="$1"; W="$2"; H="$3"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
rsync -a --exclude '.git' --exclude 'material' --exclude 'archive' --exclude 'autor' --exclude 'references' --exclude '.autopilot' "$SRC"/ "$TMP"/ >/dev/null
cat >> "$TMP/index.html" <<'HTML'
<script>
setTimeout(function(){
  function box(s){var e=document.querySelector(s);if(!e)return null;var r=e.getBoundingClientRect();
    return {t:Math.round(r.top),b:Math.round(r.bottom),l:Math.round(r.left),r:Math.round(r.right),w:Math.round(r.width),h:Math.round(r.height)};}
  var de=document.documentElement;
  var card=document.querySelector('.reel__item');
  var out={
    vw:window.innerWidth, vh:window.innerHeight,
    hOverflow: de.scrollWidth - de.clientWidth,
    vScroll: de.scrollHeight - de.clientHeight,
    page:box('.page'), hero:box('.hero'), col:box('.hero__col'),
    h1:box('.display'), lead:box('.lead'), cta:box('.cta'), hand:box('.hand'),
    mascot:box('.mascot'), img:box('.mascot__img'), spark:box('.doodle--spark'),
    reelWrap:box('.reel-wrap'), card1:card?box('.reel__item'):null, micro:box('.micro'), action:box('.action'),
    h1size: getComputedStyle(document.querySelector('.display')).fontSize,
    handGone: !document.querySelector('.hand'),
    microText: document.querySelector('.micro').textContent.trim(),
    buttons: document.querySelectorAll('a.cta, button').length
  };
  var payload = 'M::'+JSON.stringify(out);
  document.title = payload;
  try { if (window.parent !== window) window.parent.document.title = payload; } catch(e){}
}, 3200);
</script>
HTML
PAGE="$TMP/index.html"
if [ "$W" -lt 500 ]; then
  printf '%s' '<!doctype html><meta charset=utf-8><title>waiting</title><style>html,body{margin:0;padding:0;overflow:hidden}iframe{width:'"$W"'px;height:'"$H"'px;border:0;display:block}</style><iframe src="index.html"></iframe>' > "$TMP/_frame.html"
  PAGE="$TMP/index.html"
fi
"$CHROME" --headless=old --disable-gpu --hide-scrollbars --force-prefers-reduced-motion --force-device-scale-factor=1 \
  --virtual-time-budget=7000 --window-size=$W,$H --dump-dom "file://$PAGE" 2>/dev/null \
  | grep -o 'M::{.*}' | head -1 | sed 's/^M:://'
rm -rf "$TMP"
