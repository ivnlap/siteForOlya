#!/bin/bash
# Скриншот сайта в headless Chrome.
# Копия во временную папку: Chrome отдаёт закешированный CSS по одному и тому же file://.
# Ширины < 500px рендерятся во фрейме: headless Chrome не умеет вьюпорт уже 500px.
set -e
SRC="$1"; OUT="$2"; W="$3"; H="$4"; FULL="$5"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
rsync -a --exclude '.git' --exclude 'material' --exclude 'archive' --exclude 'autor' --exclude 'references' "$SRC"/ "$TMP"/ >/dev/null
TARGET="file://$TMP/index.html"

if [ "$W" -lt 500 ]; then
  cat > "$TMP/_frame.html" <<HTML
<!doctype html><meta charset=utf-8>
<style>html,body{margin:0;padding:0;background:#8a8a8a;overflow:hidden}
iframe{width:${W}px;height:${H}px;border:0;display:block}</style>
<iframe src="index.html"></iframe>
HTML
  TARGET="file://$TMP/_frame.html"
  RW=$((W)); RH=$((H))
else
  RW=$W; RH=$H
fi

ARGS=(--headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1
      --virtual-time-budget=9000 --window-size=$RW,$RH --screenshot="$OUT")
[ "$FULL" = "full" ] && ARGS+=(--screenshot-format=png)
"$CHROME" "${ARGS[@]}" "$TARGET" >/dev/null 2>&1
rm -rf "$TMP"
echo "$OUT"
