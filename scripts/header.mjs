// Анимированная шапка профиля (тёмная и светлая). Анимация SMIL — работает в <img> на GitHub.
// node scripts/header.mjs assets
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? 'assets';
mkdirSync(OUT, { recursive: true });

const NAME = 'laider';
const W = 1200;
const H = 340;
const LINES = ['пишу на Rust и TypeScript', 'делаю приложения для Windows и macOS', 'люблю чистый дизайн и приватность'];
const FONT_SIZE = 24;
const CHAR_W = 14.4; // ширина символа моноширинного шрифта при 24px (0.6em)
const SLOT = 5; // секунд на строку
const TOTAL = SLOT * LINES.length;
const X = 96;
const NAME_Y = 182;
const TYPE_Y = 244;

const SANS = "ui-sans-serif, -apple-system, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Inter, system-ui, sans-serif";
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";

const r = (n) => Math.round(n * 1000) / 1000;

/** Кадры набора строки: по символу, пауза, стирание. Возвращает keyTimes и ширины маски. */
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
  for (let s = 1; s <= 8; s++) push(start + typeTime + hold + (eraseTime * s) / 8, chars * CHAR_W * (1 - s / 8));
  if (times[times.length - 1] < 1) push(TOTAL, 0);
  return { times, values };
}

function header(theme) {
  const dark = theme === 'dark';
  const bg = dark ? '#060607' : '#F5F5F7';
  const fg = dark ? '#F5F5F7' : '#0A0A0B';
  const muted = dark ? '#8E8E93' : '#6E6E73';
  const hair = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const glow = dark ? '#FFFFFF' : '#000000';
  const metalTop = dark ? '#FFFFFF' : '#2C2C2E';
  const metalBottom = dark ? '#8E8E93' : '#0A0A0B';

  // Строки с набором и общий курсор.
  const clips = [];
  const texts = [];
  const caret = new Map();
  LINES.forEach((text, i) => {
    const chars = [...text].length;
    const { times, values } = typing(i, chars);
    clips.push(`<clipPath id="t${i}"><rect x="${X}" y="${TYPE_Y - 28}" width="0" height="40">
        <animate attributeName="width" dur="${TOTAL}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${times.join(';')}" values="${values.join(';')}"/></rect></clipPath>`);
    texts.push(`<text x="${X}" y="${TYPE_Y}" clip-path="url(#t${i})" textLength="${r(chars * CHAR_W)}" lengthAdjust="spacingAndGlyphs">${text}</text>`);
    times.forEach((t, k) => {
      if (t >= i / LINES.length - 1e-9 && t <= (i + 1) / LINES.length + 1e-9) caret.set(t, values[k]);
    });
  });
  const frames = [...caret.entries()].sort((a, b) => a[0] - b[0]);
  if (frames[0][0] !== 0) frames.unshift([0, 0]);
  if (frames[frames.length - 1][0] !== 1) frames.push([1, 0]);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${NAME}">
  <defs>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.55" stop-color="${bg}" stop-opacity="0"/>
      <stop offset="1" stop-color="${bg}" stop-opacity="0.95"/>
    </radialGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1" fill="${fg}" fill-opacity="${dark ? 0.11 : 0.13}"/>
    </pattern>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.15" stop-color="${metalTop}"/>
      <stop offset="1" stop-color="${metalBottom}"/>
    </linearGradient>
    <!-- Блик, пробегающий по нику. -->
    <linearGradient id="sheen" gradientUnits="userSpaceOnUse" x1="-260" y1="0" x2="-20" y2="0">
      <stop offset="0" stop-color="${dark ? '#FFFFFF' : '#FFFFFF'}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${dark ? '#FFFFFF' : '#FFFFFF'}" stop-opacity="${dark ? 0.95 : 0.55}"/>
      <stop offset="1" stop-color="${dark ? '#FFFFFF' : '#FFFFFF'}" stop-opacity="0"/>
      <animateTransform attributeName="gradientTransform" type="translate" values="0 0; 0 0; 760 0; 760 0"
        keyTimes="0; 0.55; 0.85; 1" dur="6s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${fg}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${fg}" stop-opacity="${dark ? 0.5 : 0.35}"/>
      <stop offset="1" stop-color="${fg}" stop-opacity="0"/>
    </linearGradient>
    ${clips.join('\n    ')}
  </defs>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${bg}"/>

    <!-- Мягкий свет, медленно плывущий за текстом. -->
    <g filter="url(#blur)" opacity="${dark ? 0.16 : 0.08}">
      <circle cx="320" cy="150" r="190" fill="${glow}">
        <animate attributeName="cx" values="320;620;380;320" dur="20s" repeatCount="indefinite" calcMode="spline"
          keyTimes="0;0.4;0.75;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1"/>
      </circle>
      <circle cx="980" cy="230" r="150" fill="${glow}">
        <animate attributeName="cy" values="230;110;230" dur="14s" repeatCount="indefinite" calcMode="spline"
          keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
      </circle>
    </g>

    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>

    <!-- Тонкий луч, скользящий по нижней кромке. -->
    <rect x="-300" y="${H - 1.5}" width="300" height="1.5" fill="url(#beam)">
      <animate attributeName="x" values="-300;${W}" dur="7s" repeatCount="indefinite"/>
    </rect>

    <!-- Ник: металлическая заливка, плавное появление и бегущий блик. -->
    <g font-family="${SANS}" font-size="132" font-weight="800" letter-spacing="-3">
      <g opacity="0">
        <animate attributeName="opacity" values="0;1" dur="1s" fill="freeze"/>
        <animateTransform attributeName="transform" type="translate" values="0 14;0 0" dur="1s" fill="freeze"
          calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/>
        <text x="${X - 6}" y="${NAME_Y}" fill="url(#metal)">${NAME}</text>
        <text x="${X - 6}" y="${NAME_Y}" fill="url(#sheen)">${NAME}</text>
      </g>
    </g>

    <!-- Строка с набором текста. -->
    <g font-family="${MONO}" font-size="${FONT_SIZE}" fill="${muted}">
      <text x="${X}" y="${TYPE_Y}" fill="${fg}" opacity="0.45" text-anchor="end" dx="-14">›</text>
      ${texts.join('\n      ')}
      <rect x="${X}" y="${TYPE_Y - 21}" width="2.5" height="27" fill="${fg}">
        <animate attributeName="x" dur="${TOTAL}s" repeatCount="indefinite" calcMode="discrete"
          keyTimes="${frames.map(([t]) => t).join(';')}" values="${frames.map(([, v]) => r(X + v + 3)).join(';')}"/>
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/>
      </rect>
    </g>

    <!-- Монограмма справа: стеклянная плитка с бегущим по рамке светом. -->
    <g transform="translate(${W - 276} ${H / 2 - 90})">
      ${monogram(fg, hair, dark)}
    </g>

    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="23.5" fill="none" stroke="${hair}"/>
  </g>
</svg>
`;
}

/** Плитка 180×180 с буквой L. */
function monogram(fg, hair, dark) {
  return `<rect width="180" height="180" rx="44" fill="${fg}" fill-opacity="${dark ? 0.04 : 0.05}" stroke="${hair}" stroke-width="1.5"/>
      <rect x="1" y="1" width="178" height="178" rx="43" fill="none" stroke="${fg}" stroke-opacity="${dark ? 0.7 : 0.55}"
        stroke-width="2" stroke-linecap="round" stroke-dasharray="90 610" pathLength="700">
        <animate attributeName="stroke-dashoffset" values="0;-700" dur="5s" repeatCount="indefinite"/>
      </rect>
      <rect x="1" y="1" width="178" height="178" rx="43" fill="none" stroke="${fg}" stroke-opacity="${dark ? 0.25 : 0.2}"
        stroke-width="2" stroke-linecap="round" stroke-dasharray="40 660" pathLength="700">
        <animate attributeName="stroke-dashoffset" values="-350;-1050" dur="5s" repeatCount="indefinite"/>
      </rect>
      <text x="90" y="124" text-anchor="middle" fill="url(#metal)" font-size="104" font-weight="800"
        font-family="${SANS}">L</text>`;
}

writeFileSync(join(OUT, 'header-dark.svg'), header('dark'));
writeFileSync(join(OUT, 'header-light.svg'), header('light'));
console.log('ok');
