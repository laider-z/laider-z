// Генератор анимированной шапки профиля GitHub (SVG, анимация SMIL — работает в <img>).
// node scripts/header.mjs assets
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const W = 1200;
const H = 300;
const LINES = ['пишу на Rust и TypeScript', 'делаю приложения для Windows и macOS', 'люблю чистый дизайн и приватность'];
const FONT_SIZE = 24;
const CHAR_W = 14.4; // ширина символа моноширинного шрифта при 24px (0.6em)
const SLOT = 5; // секунд на строку
const TOTAL = SLOT * LINES.length;
const TYPE_X = 96;
const TYPE_Y = 212;

const r = (n) => Math.round(n * 1000) / 1000;

/** Значения ширины маски по кадрам: набор по символу, пауза, стирание, пустота. */
function typing(index, chars) {
  const start = index * SLOT;
  const typeTime = Math.min(2, 0.07 * chars);
  const hold = 2.4;
  const eraseTime = 0.5;
  const times = [0];
  const values = [0];
  const push = (t, v) => {
    times.push(r(t / TOTAL));
    values.push(r(v));
  };
  if (start > 0) push(start, 0);
  for (let c = 1; c <= chars; c++) push(start + (typeTime * c) / chars, c * CHAR_W + 2);
  push(start + typeTime + hold, chars * CHAR_W + 2);
  const steps = 8;
  for (let s = 1; s <= steps; s++) push(start + typeTime + hold + (eraseTime * s) / steps, chars * CHAR_W * (1 - s / steps));
  if (times[times.length - 1] < 1) push(TOTAL, 0);
  return { keyTimes: times.join(';'), values: values.join(';') };
}

function header(theme) {
  const dark = theme === 'dark';
  const bg = dark ? '#0A0A0B' : '#F5F5F7';
  const fg = dark ? '#F5F5F7' : '#0A0A0B';
  const muted = dark ? '#8E8E93' : '#6E6E73';
  const line = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const glow = dark ? '#FFFFFF' : '#0A0A0B';

  const clips = [];
  const texts = [];
  LINES.forEach((text, i) => {
    const chars = [...text].length;
    const { keyTimes, values } = typing(i, chars);
    clips.push(`<clipPath id="c${i}"><rect x="${TYPE_X}" y="${TYPE_Y - 28}" width="0" height="40">
      <animate attributeName="width" dur="${TOTAL}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${values}"/></rect></clipPath>`);
    texts.push(`<text x="${TYPE_X}" y="${TYPE_Y}" clip-path="url(#c${i})" textLength="${r(chars * CHAR_W)}" lengthAdjust="spacingAndGlyphs">${text}</text>`);
  });

  // Курсор: одна фигура, позиция берётся из анимации активной строки (по одной анимации на отрезок).
  const caretAnims = LINES.map((text, i) => {
    const chars = [...text].length;
    const { keyTimes, values } = typing(i, chars);
    const kt = keyTimes.split(';').map(Number);
    const vs = values.split(';').map(Number);
    return { kt, vs };
  });
  // Сводим позиции курсора всех строк в одну последовательность кадров.
  const frames = new Map();
  caretAnims.forEach(({ kt, vs }, i) => {
    kt.forEach((t, k) => {
      const inSlot = t >= i / LINES.length - 1e-9 && t <= (i + 1) / LINES.length + 1e-9;
      if (inSlot) frames.set(t, vs[k]);
    });
  });
  const sorted = [...frames.entries()].sort((a, b) => a[0] - b[0]);
  if (sorted[0][0] !== 0) sorted.unshift([0, 0]);
  if (sorted[sorted.length - 1][0] !== 1) sorted.push([1, 0]);
  const caretKt = sorted.map(([t]) => t).join(';');
  const caretX = sorted.map(([, v]) => r(TYPE_X + v + 3)).join(';');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="laider-z">
  <defs>
    <radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${glow}" stop-opacity="${dark ? 0.09 : 0.06}"/>
      <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${line}" stroke-width="1"/>
    </pattern>
    <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${bg}" stop-opacity="0"/>
      <stop offset="0.55" stop-color="${bg}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${bg}" stop-opacity="1"/>
    </linearGradient>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="20"/></clipPath>
    ${clips.join('\n    ')}
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <rect width="${W}" height="${H}" fill="url(#grid)"/>
    <circle cx="300" cy="120" r="420" fill="url(#g)">
      <animateTransform attributeName="transform" type="translate" dur="18s" repeatCount="indefinite"
        values="0 0; 520 60; 160 -40; 0 0" keyTimes="0;0.4;0.75;1" calcMode="spline"
        keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"/>
    </circle>
    <rect width="${W}" height="${H}" fill="url(#fade)" opacity="0.35"/>
    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="none" stroke="${line}"/>

    <g font-family="ui-sans-serif, -apple-system, 'Segoe UI Variable Display', 'Segoe UI', Inter, system-ui, sans-serif">
      <text x="${TYPE_X}" y="156" fill="${fg}" font-size="72" font-weight="700" letter-spacing="-0.5">laider<tspan dx="-4">-z</tspan>
        <animate attributeName="opacity" values="0;1" dur="0.8s" fill="freeze"/>
      </text>
    </g>
    <g font-family="ui-monospace, 'Cascadia Mono', 'SF Mono', Menlo, Consolas, monospace" font-size="${FONT_SIZE}" fill="${muted}">
      <text x="${TYPE_X - 30}" y="${TYPE_Y}" fill="${fg}" opacity="0.5">›</text>
      ${texts.join('\n      ')}
      <rect x="${TYPE_X}" y="${TYPE_Y - 21}" width="2.5" height="27" fill="${fg}">
        <animate attributeName="x" dur="${TOTAL}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${caretKt}" values="${caretX}"/>
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/>
      </rect>
    </g>

    <g transform="translate(${W - 256} ${H / 2 - 80})">
      ${monogram(fg, bg, line)}
    </g>
  </g>
</svg>
`;
}

/** Монограмма «lz» в скруглённом квадрате 160×160; по рамке медленно бежит блик. */
function monogram(fg, bg, line) {
  return `<rect width="160" height="160" rx="38" fill="${fg}" fill-opacity="0.04" stroke="${line}" stroke-width="1.5"/>
      <rect x="0.75" y="0.75" width="158.5" height="158.5" rx="37.5" fill="none" stroke="${fg}" stroke-opacity="0.55"
        stroke-width="1.5" stroke-linecap="round" stroke-dasharray="70 530" pathLength="600">
        <animate attributeName="stroke-dashoffset" values="0;-600" dur="6s" repeatCount="indefinite"/>
      </rect>
      <text x="80" y="103" text-anchor="middle" fill="${fg}" font-size="66" font-weight="700" letter-spacing="-1"
        font-family="ui-sans-serif, -apple-system, 'Segoe UI Variable Display', 'Segoe UI', Inter, system-ui, sans-serif">lz</text>`;
}

writeFileSync(join(OUT, 'header-dark.svg'), header('dark'));
writeFileSync(join(OUT, 'header-light.svg'), header('light'));
console.log('ok');
