#!/usr/bin/env python3
"""Ревизор статики: запреты брифа, a11y, вес страницы."""
import re, os, sys, html as ihtml

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
H = open(os.path.join(ROOT,'index.html'),encoding='utf-8').read()
C = open(os.path.join(ROOT,'styles.css'),encoding='utf-8').read()
J = open(os.path.join(ROOT,'script.js'),encoding='utf-8').read()
Cx = re.sub(r'/\*.*?\*/','',C,flags=re.S)   # без комментариев: в них цвета — это текст
fails, warns, oks = [], [], []
def ck(cond, ok, bad, warn=False):
    (oks if cond else (warns if warn else fails)).append(ok if cond else bad)

# --- 1. чистый чёрный / белый ------------------------------------------------
bad = re.findall(r'#(?:fff|ffffff|000|000000)\b', Cx, re.I)
ck(not bad, 'нет #FFF/#000', f'найдены чистые цвета: {set(bad)}')

# --- 2. единственная кнопка --------------------------------------------------
ctas = re.findall(r'class="[^"]*\bcta\b[^"]*"', H)
btns = re.findall(r'<button', H)
ck(len(ctas)==1 and not btns, 'одна кнопка на странице', f'кнопок: cta={len(ctas)}, button={len(btns)}')

# --- 3. подпись у кнопки убрана ---------------------------------------------
# «текст под кнопкой» — это строка фактов: пользователь указал на неё кропом
ck('class="facts"' not in H and '.facts' not in Cx and '18 films' not in H,
   'строки фактов под кнопкой нет ни в разметке, ни в стилях',
   'строка «18 films · …» ещё в коде')
ck('class="hand"' in H and 'usually reply same day' in H,
   'подпись «usually reply same day» рядом с кнопкой на месте',
   'подпись у кнопки пропала — пользователь просил её вернуть')

# --- 4. подвал ---------------------------------------------------------------
micro = re.search(r'<p class="micro">(.*?)</p>', H, re.S)
mt = re.sub(r'<[^>]+>','', micro.group(1)).strip() if micro else ''
ck('All rights reserved' in mt, f'подвал: «{mt}»', f'нет «All rights reserved», в подвале: «{mt}»')
ck('made with AI' not in H, 'в подвале нет «made with AI»', '«made with AI» ещё на странице')

# --- 5. заголовок ------------------------------------------------------------
h1 = re.search(r'<h1[^>]*>(.*?)</h1>', H, re.S).group(1)
h1t = ihtml.unescape(re.sub(r'<[^>]+>',' ', h1.replace('<br>','\n'))).replace('\xa0',' ')
lines = [l.strip() for l in h1t.split('\n') if l.strip()]
ck(lines == ['Short cartoons about you and your kids','any theme, any style'],
   'H1 дословно из брифа, две строки', f'H1 разошёлся с брифом: {lines}')
ck('<em>' in h1, 'акцентный курсив в H1 есть', 'нет <em> в H1')

# --- 6. мета совпадает с заголовком -----------------------------------------
title = re.search(r'<title>(.*?)</title>', H).group(1)
ck('about you and your kids' in title, f'<title> обновлён', f'<title> устарел: {title}')
og = re.search(r'og:title" content="([^"]*)"', H).group(1)
ck('about you and your kids' in og, 'og:title обновлён', f'og:title устарел: {og}')

# --- 7. alt и размеры у картинок --------------------------------------------
imgs = re.findall(r'<img\b[^>]*>', H)
noalt = [i for i in imgs if 'alt=' not in i]
nodim = [i for i in imgs if not ('width=' in i and 'height=' in i)]
ck(not noalt, f'у всех {len(imgs)} img есть alt', f'без alt: {len(noalt)}')
ck(not nodim, 'у всех img есть width/height', f'без width/height: {len(nodim)}')

# --- 8. маскот ---------------------------------------------------------------
ck('mascot-wave-440.webp' in H and 'mascot-wave-880.webp' in H,
   'маскот подключён в webp в двух ширинах', 'маскот подключён не полностью')
ck('mascot-wave-440.png' in H, 'png-фолбэк для маскота есть', 'нет png-фолбэка (прозрачность, JPEG нельзя)')

# --- 9. reduced motion -------------------------------------------------------
ck('prefers-reduced-motion:reduce' in C.replace(' ',''), 'ветка prefers-reduced-motion есть', 'нет prefers-reduced-motion')

# --- 10. ловушка с грид-колонкой --------------------------------------------
ck('grid-template-columns:minmax(0,1fr)' in C.replace(' ',''), '.page держит minmax(0,1fr)', 'ловушка вернулась: нет minmax(0,1fr)')
ck('.page > *{min-width:0}' in C.replace('  ',' '), '.page > * {min-width:0} на месте', 'нет min-width:0 у детей .page')

# --- 11. копирайт страницы ---------------------------------------------------
def strip(x):
    x = re.sub(r'<!--.*?-->','',x,flags=re.S)
    x = re.sub(r'<svg.*?</svg>','',x,flags=re.S)
    return ihtml.unescape(re.sub(r'<[^>]+>',' ',x)).replace('\xa0',' ')
def wc(x):
    return len([w for w in re.split(r'\s+', strip(x)) if w.strip() and w.strip() != '·'])
prose_blocks = [re.search(r'<p class="kicker">.*?</p>',H,re.S), re.search(r'<h1.*?</h1>',H,re.S),
                re.search(r'<p class="lead">.*?</p>',H,re.S), re.search(r'<span>Message us on WhatsApp</span>',H),
                re.search(r'<p class="facts">.*?</p>',H,re.S), re.search(r'<p class="micro">.*?</p>',H,re.S)]
prose = sum(wc(b.group(0)) for b in prose_blocks if b)
titles = sum(wc(t) for t in re.findall(r'<span class="card__title">.*?</span>',H,re.S))
ck(prose < 60, f'копирайт страницы: {prose} слов прозы (< 60); плюс {titles} слов — названия роликов, это контент, а не текст сайта',
   f'копирайт страницы: {prose} слов, порог 60')

# --- 12. кнопка ведёт в WhatsApp ---------------------------------------------
# wa.me принимает только цифры: плюс, пробелы и дефисы в номере ломают открытие
# диалога молча — ссылка откроется, но на пустой экран WhatsApp.
wa = re.search(r"WHATSAPP_URL\s*=\s*'([^']*)'", J)
wa = wa.group(1) if wa else ''
ck(re.fullmatch(r'https://wa\.me/\d{10,15}', wa) is not None,
   f'WHATSAPP_URL — рабочая ссылка: {wa}',
   f'WHATSAPP_URL не годится для wa.me (нужны только цифры, без + и дефисов): {wa!r}')

# --- 13. вес первого экрана --------------------------------------------------
def size(p):
    p = os.path.join(ROOT,p)
    return os.path.getsize(p) if os.path.exists(p) else 0
crit = ['index.html','styles.css','script.js',
        'assets/fonts/GeneralSans-400.woff2','assets/fonts/GeneralSans-500.woff2',
        'assets/fonts/GeneralSans-600.woff2','assets/fonts/GeneralSans-600i.woff2',
        'assets/img/mascot-wave-440.webp',
        'assets/img/garden-680.webp','assets/img/fruits-680.webp']
total = sum(size(p) for p in crit)
ck(total < 800*1024, f'вес первого экрана ≈ {total//1024} КБ (< 800)', f'вес первого экрана {total//1024} КБ, порог 800')
ck(size('assets/img/mascot-wave-880.webp') < 200*1024,
   f'маскот@880 {size("assets/img/mascot-wave-880.webp")//1024} КБ', 'маскот@880 тяжелее 200 КБ')

# --- 14. шрифты: нет мёртвых @font-face --------------------------------------
faces = re.findall(r"font-family:'([^']+)'[^}]*?src:url", C)
used = set()
for fam in set(faces):
    if fam.lower() in C.lower().split('@font-face')[-1] or f"'{fam}'" in C.split('}',1)[1]:
        used.add(fam)
ck("font-family:'Caveat'" in Cx and '--font-hand' in Cx, 'Caveat подключён — на нём подпись у кнопки', 'подпись у кнопки есть, а Caveat не подключён')

# --- 15. контраст ------------------------------------------------------------
def lum(hexs):
    r,g,b = (int(hexs[i:i+2],16)/255 for i in (1,3,5))
    f = lambda c: c/12.92 if c<=.03928 else ((c+.055)/1.055)**2.4
    return .2126*f(r)+.7152*f(g)+.0722*f(b)
def ratio(a,b):
    la,lb = lum(a),lum(b)
    hi,lo = max(la,lb),min(la,lb)
    return (hi+.05)/(lo+.05)
CREAM='#FDFBF4'
pairs = [('--ink-900 на кремовом','#16130E',CREAM,4.5),
         ('--ink-700 на кремовом','#3B342B',CREAM,4.5),
         ('--ink-500 (факты, подвал)','#6E6355',CREAM,4.5),
         ('коралл H1 (крупный)','#F0655A',CREAM,3.0),
         ('текст кнопки на коралле','#16130E','#F0655A',4.5)]
for name,fg,bg,thr in pairs:
    r = ratio(fg,bg)
    ck(r>=thr, f'{name}: {r:.2f}:1 (порог {thr})', f'{name}: {r:.2f}:1 — ниже порога {thr}')

print('\n'.join('  ok    '+o for o in oks))
if warns: print('\n'.join('  warn  '+w for w in warns))
if fails: print('\n'.join('  FAIL  '+f for f in fails))
print(f"\n{len(oks)} ok · {len(warns)} warn · {len(fails)} fail")
sys.exit(1 if fails else 0)
