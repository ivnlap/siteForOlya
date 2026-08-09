# Шрифты

Лежат локально, никаких запросов к Google Fonts и Fontshare со страницы не уходит.
Все объявления `@font-face` — в начале `styles.css` каждого варианта, `font-display: swap`.

| Файл | Гарнитура | Начертание | Где используется |
|---|---|---|---|
| `GeneralSans-400.woff2` | General Sans | Regular | body, lead |
| `GeneralSans-500.woff2` | General Sans | Medium | кнопка, строка фактов, названия роликов |
| `GeneralSans-600.woff2` | General Sans | Semibold | H1, кикер |
| `GeneralSans-600i.woff2` | General Sans | Semibold Italic | акцентные слова в H1 |
| `Caveat-500.woff2` | Caveat | Medium | **только** рукописная подпись у кнопки |

General Sans — Indian Type Foundry, лицензия ISO (Fontshare), бесплатна для коммерческого
использования. Caveat — Impallari Type, SIL Open Font License 1.1.

Предзагружаются только 600 и 600i: они рисуют первый экран, остальное подтягивается по ходу.

Правило из `DESIGN-SYSTEM.md` §2.2, которое нельзя нарушать: рукописный шрифт —
никогда в заголовке, кнопке и body. Только 2–5 слов подписи рядом со стрелкой.

## Если понадобится заменить

`--font-display`, `--font-text`, `--font-hand` объявлены в `:root` каждого варианта.
Альтернативы, согласованные с дизайн-системой: Poppins, Gilroy, Switzer вместо
General Sans; Kalam вместо Caveat.
