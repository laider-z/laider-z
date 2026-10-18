// Аватарка профиля: ник laider на тёмном фоне. GitHub обрезает её кругом,
// поэтому всё важное — в центральном круге. Из SVG делается PNG 920×920 для загрузки.
// node scripts/avatar.mjs assets
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] ?? 'assets';
mkdirSync(OUT, { recursive: true });

const SANS = "ui-sans-serif, -apple-system, 'SF Pro Display', 'Segoe UI Variable Display', 'Segoe UI', Inter, system-ui, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="460" viewBox="0 0 460 460">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.38" r="0.75">
      <stop offset="0" stop-color="#1F1F22"/>
      <stop offset="0.7" stop-color="#0A0A0B"/>
      <stop offset="1" stop-color="#050506"/>
    </radialGradient>
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="0.9" fill="#FFFFFF" fill-opacity="0.09"/>
    </pattern>
    <radialGradient id="fade" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.45" stop-color="#0A0A0B" stop-opacity="0"/>
      <stop offset="1" stop-color="#0A0A0B" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.1" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="#9A9AA0"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="460" height="460" fill="url(#bg)"/>
  <rect width="460" height="460" fill="url(#dots)"/>
  <rect width="460" height="460" fill="url(#fade)"/>
  <text x="230" y="266" text-anchor="middle" fill="url(#metal)" font-family="${SANS}" font-size="114" font-weight="800"
    letter-spacing="-2">laider</text>
  <rect x="140" y="302" width="180" height="2" rx="1" fill="url(#line)"/>
</svg>
`;

writeFileSync(join(OUT, 'avatar.svg'), svg);
console.log('ok');
