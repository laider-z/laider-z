// Карточка активности профиля (тёмная и светлая) по данным GitHub GraphQL API.
// Запускается в GitHub Actions раз в день: GITHUB_TOKEN=… node scripts/stats.mjs <out_dir>
// Без сторонних сервисов: картинка лежит в ветке output этого же репозитория.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const LOGIN = 'laider-z';
const OUT = process.argv[2] ?? 'dist';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('нужен GITHUB_TOKEN');

const query = `query($login: String!) {
  user(login: $login) {
    createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { authorization: `bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
});
const { data, errors } = await response.json();
if (errors) throw new Error(JSON.stringify(errors));

const calendar = data.user.contributionsCollection.contributionCalendar;
const days = calendar.weeks.flatMap((week) => week.contributionDays);

// Серии: текущая считается, даже если сегодня ещё не было вклада (заканчивается вчера).
let longest = 0;
let run = 0;
for (const day of days) {
  run = day.contributionCount > 0 ? run + 1 : 0;
  longest = Math.max(longest, run);
}
let current = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) current++;
  else if (i === days.length - 1) continue;
  else break;
}
const activeDays = days.filter((day) => day.contributionCount > 0).length;

const plural = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const cells = [
  { value: calendar.totalContributions, label: 'вклад за год' },
  { value: current, label: `${plural(current, 'день', 'дня', 'дней')} подряд сейчас` },
  { value: longest, label: `${plural(longest, 'день', 'дня', 'дней')} — лучшая серия` },
  { value: activeDays, label: `${plural(activeDays, 'активный день', 'активных дня', 'активных дней')}` },
];

// Мини-график: вклад по неделям за последние 26 недель.
const weekly = calendar.weeks.slice(-26).map((week) => week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0));
const peak = Math.max(1, ...weekly);

function card(theme) {
  const dark = theme === 'dark';
  const bg = dark ? '#0A0A0B' : '#F5F5F7';
  const fg = dark ? '#F5F5F7' : '#0A0A0B';
  const muted = dark ? '#8E8E93' : '#6E6E73';
  const line = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const W = 1200;
  const H = 220;
  const colW = 230;
  const sans = "ui-sans-serif, -apple-system, 'Segoe UI Variable Display', 'Segoe UI', Inter, system-ui, sans-serif";

  const stats = cells
    .map(
      (cell, i) => `<g transform="translate(${48 + i * colW} 0)" opacity="0">
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="${0.1 + i * 0.12}s" fill="freeze"/>
      <text x="0" y="112" fill="${fg}" font-size="52" font-weight="700" letter-spacing="-1">${cell.value}</text>
      <text x="0" y="146" fill="${muted}" font-size="17">${cell.label}</text>
    </g>`,
    )
    .join('\n    ');

  const chartX = 48 + cells.length * colW + 10;
  const chartW = W - chartX - 48;
  const barW = chartW / weekly.length;
  const bars = weekly
    .map((value, i) => {
      const h = Math.max(3, (value / peak) * 96);
      return `<rect x="${(chartX + i * barW + 1.5).toFixed(1)}" y="${(150 - h).toFixed(1)}" width="${(barW - 3).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${fg}" fill-opacity="${value ? 0.85 : 0.15}">
        <animate attributeName="height" values="0;${h.toFixed(1)}" dur="0.8s" begin="${(0.3 + i * 0.02).toFixed(2)}s" fill="freeze"/>
        <animate attributeName="y" values="150;${(150 - h).toFixed(1)}" dur="0.8s" begin="${(0.3 + i * 0.02).toFixed(2)}s" fill="freeze"/>
      </rect>`;
    })
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Активность laider на GitHub">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="19.5" fill="${bg}" stroke="${line}"/>
  <g font-family="${sans}">
    <text x="48" y="48" fill="${muted}" font-size="15" letter-spacing="1.5">АКТИВНОСТЬ НА GITHUB</text>
    ${stats}
    <text x="${chartX}" y="48" fill="${muted}" font-size="15" letter-spacing="1.5">ПОЛГОДА</text>
    ${bars}
    <text x="${W - 48}" y="190" text-anchor="end" fill="${muted}" font-size="13" opacity="0.7">обновлено ${new Date().toISOString().slice(0, 10)}</text>
  </g>
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'stats-dark.svg'), card('dark'));
writeFileSync(join(OUT, 'stats-light.svg'), card('light'));
console.log(`вклад ${calendar.totalContributions}, серия ${current}, лучшая ${longest}`);
