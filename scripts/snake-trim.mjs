// Убирает из «змейки» полосу прогресса под сеткой и обрезает пустое место снизу.
// node scripts/snake-trim.mjs dist/snake-dark.svg dist/snake-light.svg
import { readFileSync, writeFileSync } from 'node:fs';

for (const file of process.argv.slice(2)) {
  let svg = readFileSync(file, 'utf8');
  svg = svg.replace(/<rect[^>]*class="u[^"]*"[^>]*\/>/g, '').replace(/<rect[^>]*class="u[^"]*"[^>]*>.*?<\/rect>/gs, '');
  svg = svg.replace('</style>', '.u{display:none}</style>');
  // Сетка 7×16 px начинается с y=0: оставляем по 16 px сверху и снизу.
  svg = svg.replace(/viewBox="(-?\d+) -?\d+ (\d+) \d+" width="(\d+)" height="\d+"/, (_, x, w, width) => `viewBox="${x} -16 ${w} 144" width="${width}" height="144"`);
  writeFileSync(file, svg);
}
console.log('ok');
