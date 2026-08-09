# Контракт между тасками

Что уже построено и на что опираются T06 и T07. Эталон — `v1-reel/`.

## Общие ассеты (T02, готово)

`assets/img/` — общие для всех трёх вариантов, путь из варианта: `../assets/img/…`

| Файл | Что | Размер |
|---|---|---|
| `garden-{680,960}.{webp,jpg}` | Who's in the Garden? · 2:34 | 55–102 КБ |
| `fruits-{680,960}.{webp,jpg}` | Summer Fruits Song · 2:18 | 56–102 КБ |
| `colours-{680,960}.{webp,jpg}` | My First Colours Song · 2:37 | 60–111 КБ |
| `seasons-{680,960}.{webp,jpg}` | Four Seasons Song · 2:38 | 80–167 КБ |
| `snack-{680,960}.{webp,jpg}` | Dog vs Cat and The Flying Snack · 0:55 | 40–80 КБ |
| `mascot-face.{webp,png}` | Вырезанный крупный план маскота, 421×527, альфа | 26/79 КБ |
| `mascot-sit.{webp,png}` | Маскот сидя в полный рост, 214×364, альфа | 17/36 КБ |
| `og.jpg` · `favicon-32.png` · `apple-touch-icon.png` | мета | 152/3/58 КБ |

Все обложки 16:9. Разметка карточки — `<picture>` c `<source type="image/webp">`,
`srcset` на 680w/960w, `sizes="(max-width: 767px) 86vw, 32vw"`, явные `width="960"
height="540"`, у первых двух `fetchpriority="high"`, у остальных `loading="lazy"`.

## Шрифты (T01, готово)

`assets/fonts/` — self-host, реальные файлы: `GeneralSans-{400,500,600,600i}.woff2`,
`Caveat-500.woff2`. Все пять `@font-face` объявлены в начале `styles.css` каждого
варианта, `font-display: swap`. Preload — только 600 и 600i.

## Токены (T01, готово)

Блок `:root` из `v1-reel/styles.css` копируется в вариант **без изменений**: цвета
`DESIGN-SYSTEM.md` §2.1, радиусы, тени, `--ease`, `--pad`, `--card-w`, `--frame-gap`.
Ни одного `#FFF`, ни одного `#000`.

## Скелет страницы

```
body (фон --frame)
└ .page   ← кремовый холст, radius 28, margin 12, height 100dvh, overflow hidden
```

**Обязательно** на `.page`: `grid-template-columns:minmax(0,1fr)` и `.page > *{min-width:0}`.
Без этого неявная грид-колонка растягивается под `max-content` ленты (~4600px) и всё
абсолютно спозиционированное уезжает за экран. Это уже стоило одного цикла отладки.

## Галерея (T03, готово)

Разметка: `.reel-wrap > ul.reel#reel[tabindex=0][role=list] > li.reel__item > a.card`.
Внутри карточки — `<picture>` и `span.card__meta` с `.card__title` + `.card__time`.

`script.js` берёт на себя: подстановку ссылок, клоны для бесшовного marquee,
параболическую дугу через `--arc`, драг мышью, колесо, клавиатуру, стартовый сдвиг
на 34% карточки (лента сразу обрезана левым краем), паузу на hover/focus/скрытой вкладке,
полное отключение автопрокрутки при `prefers-reduced-motion`.

**`script.js` копируется в вариант без изменений.** Единственное, что вариант может
переопределить, — CSS. Если варианту нужен другой размер карточки, он меняет `--card-w`.

## Кнопка (T04, готово)

Ровно один `<a class="cta" id="cta">` на страницу. На <768px тот же элемент вместе с
рукописной подписью уезжает в `position:fixed` панель внизу — дубля не создаётся.

## Заглушки

`script.js`, верх файла: `WHATSAPP_URL` (пустая строка → кнопка остаётся на `href="#"`)
и массив `VIDEOS` (все пять ведут на `https://www.youtube.com/@KikiToony`).
Оба помечены `TODO`. Менять только там.

## Контент — дословно, одинаковый во всех вариантах

- кикер `what we do`
- H1 `Short cartoons for kids&nbsp;—` / `<em>your theme</em>, our style.`
- lead `Built with AI: one character, one look, a whole series — and the subject can be yours.`
- кнопка `Message us on WhatsApp`
- подпись `usually reply same day`
- факты `18 films · 2:18–2:38 each · 4 themes · one weekly release`
- микро-ряд `2026 · made with AI`

Ни слова больше. Ни одной цифры про просмотры и подписчиков.

## Как снимать скриншоты

`scratchpad/shot.sh <вариант> <label> <ширина> <высота>` — копирует сайт во временную
папку (иначе Chrome отдаёт закешированный CSS) и для ширины <500px рендерит во фрейме,
потому что headless Chrome не умеет вьюпорт уже 500px.
