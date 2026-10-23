import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const colors = { NONE: '#17213e', FIRST_QUARTILE: '#35446d', SECOND_QUARTILE: '#6265b8', THIRD_QUARTILE: '#9b8ee7', FOURTH_QUARTILE: '#b9eee9' };

export function renderCalendar(calendar) {
  assert(Number.isSafeInteger(calendar?.totalContributions) && calendar.totalContributions >= 0, 'Invalid contribution total');
  assert(Array.isArray(calendar.weeks) && calendar.weeks.length > 0 && calendar.weeks.length <= 54, 'Invalid contribution weeks');
  const days = calendar.weeks.flatMap((week) => week.contributionDays);
  assert(days.length > 0 && days.length <= 378, 'Invalid contribution days');
  const dates = new Set();
  let previousMonth = '';
  const labels = [];
  const cells = [];
  calendar.weeks.forEach((week, column) => {
    assert(Array.isArray(week.contributionDays) && week.contributionDays.length > 0 && week.contributionDays.length <= 7, 'Invalid week');
    week.contributionDays.forEach((day) => {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(day.date) && !Number.isNaN(Date.parse(day.date)), 'Invalid date');
      assert(!dates.has(day.date), 'Duplicate date');
      dates.add(day.date);
      assert(Number.isInteger(day.weekday) && day.weekday >= 0 && day.weekday <= 6, 'Invalid weekday');
      assert(Number.isSafeInteger(day.contributionCount) && day.contributionCount >= 0, 'Invalid contribution count');
      assert(Object.hasOwn(colors, day.contributionLevel), 'Invalid contribution level');
      const x = 48 + column * 19;
      const y = 86 + day.weekday * 20;
      cells.push(`<rect x="${x}" y="${y}" width="15" height="15" rx="2" fill="${colors[day.contributionLevel]}"><title>${day.date}: ${day.contributionCount} contributions</title></rect>`);
      const month = day.date.slice(0, 7);
      if (day.date.endsWith('-01')) {
        if (previousMonth !== month && column < calendar.weeks.length - 2) {
          const name = new Date(`${day.date}T00:00:00Z`).toLocaleString('en', { month: 'short', timeZone: 'UTC' });
          labels.push(`<text x="${x}" y="71">${name}</text>`);
          previousMonth = month;
        }
      }
    });
  });
  assert(days.reduce((sum, day) => sum + day.contributionCount, 0) === calendar.totalContributions, 'Calendar total does not match its days');
  const first = days[0].date;
  const last = days.at(-1).date;
  const legend = Object.values(colors).map((color, index) => `<rect x="${936 + index * 21}" y="257" width="15" height="15" rx="2" fill="${color}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="300" viewBox="0 0 1120 300" role="img" aria-labelledby="title desc">
<title id="title">Penzragon's GitHub contributions</title>
<desc id="desc">${calendar.totalContributions} contributions from ${first} to ${last}. Each square represents one day. Only calendar dates and aggregate counts are included.</desc>
<style>text{font-family:monospace;fill:#a9b8d9;font-size:12px}.trail{animation:walk 26s linear infinite}.spark{animation:glow 4s ease-in-out infinite alternate}@keyframes walk{0%{transform:translateX(0)}100%{transform:translateX(1000px)}}@keyframes glow{from{opacity:.35}to{opacity:1}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<rect width="1120" height="300" rx="12" fill="#0b1228"/>
<rect x="1" y="1" width="1118" height="298" rx="11" fill="none" stroke="#303c62"/>
<text x="48" y="36" style="font-size:18px;fill:#eeeaff">A year of little steps</text>
<text x="1072" y="36" text-anchor="end" style="fill:#b9eee9">${calendar.totalContributions.toLocaleString('en-US')} contributions</text>
${labels.join('')}
<text x="14" y="117">M</text><text x="14" y="157">W</text><text x="14" y="197">F</text>
${cells.join('')}
<path d="M48 239H1072" stroke="#263455" stroke-dasharray="3 8"/>
<g class="trail"><g transform="translate(48 224)" fill="#c5d8f5" shape-rendering="crispEdges"><rect x="4" y="6" width="8" height="6"/><rect x="0" y="2" width="3" height="4"/><rect x="5" width="3" height="4"/><rect x="10" y="1" width="3" height="4"/><rect x="14" y="4" width="3" height="4"/></g></g>
<path class="spark" d="M1093 15v10m-5-5h10" stroke="#b9eee9" stroke-width="2"/>
<text x="48" y="269">${first} — ${last} · refreshed daily</text>
<text x="895" y="269">Less</text>${legend}<text x="1050" y="269">More</text>
</svg>\n`;
}

async function update() {
  const query = '{user(login:"Penzragon"){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date weekday contributionCount contributionLevel}}}}}}';
  let result;
  if (process.env.GH_TOKEN) {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'Penzragon-profile' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
    result = await response.json();
  } else {
    result = JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf8', timeout: 30000 }));
  }
  if (result.errors?.length) throw new Error('GitHub could not return the contribution calendar');
  const svg = renderCalendar(result.data?.user?.contributionsCollection?.contributionCalendar);
  const target = new URL('../assets/contributions.svg', import.meta.url);
  const temporary = new URL('../assets/contributions.svg.tmp', import.meta.url);
  await mkdir(new URL('../assets/', import.meta.url), { recursive: true });
  await writeFile(temporary, svg);
  await rename(temporary, target);
  console.log('Updated contribution calendar from GitHub; no repository names or private project details stored.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await update();
