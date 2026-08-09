# T03 — Галерея 16:9

Требования: R20, R21, R22, R26, R27, R34 · Волна 2 · Зона: `v1-reel/`

Full-bleed лента карточек 16:9, обрезана обоими краями, маски `mask-image` по краям.
Параболическая дуга по `translateY`, hover `scale(1.03)` + `--sh-3`, оверлей
`transparent → rgba(22,19,14,.6)` с названием и хронометражем. Драг мышью, свайп,
колесо, клавиатура, `scroll-snap-type: x proximity`, marquee с паузой на hover.
`fetchpriority="high"` первым двум, `loading="lazy"` остальным, явные width/height.

Готово, когда: лента листается всеми четырьмя способами; при `prefers-reduced-motion`
marquee выключен; ни одного сдвига layout при загрузке.
