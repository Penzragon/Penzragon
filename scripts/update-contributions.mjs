import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sky = readFileSync(new URL('../assets/skyline-background.png', import.meta.url)).toString('base64');
const levels = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];

export function renderCalendar(calendar) {
  assert(Number.isSafeInteger(calendar?.totalContributions) && calendar.totalContributions >= 0, 'Invalid contribution total');
  assert(Array.isArray(calendar.weeks) && calendar.weeks.length > 0 && calendar.weeks.length <= 54, 'Invalid contribution weeks');
  const dates = new Set();
  const weeks = calendar.weeks.map((week) => {
    assert(Array.isArray(week.contributionDays) && week.contributionDays.length > 0 && week.contributionDays.length <= 7, 'Invalid week');
    const active = new Set();
    let total = 0;
    for (const day of week.contributionDays) {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(day.date) && !Number.isNaN(Date.parse(day.date)), 'Invalid date');
      const date = new Date(day.date + 'T00:00:00Z');
      assert.equal(date.toISOString().slice(0, 10), day.date, 'Invalid calendar date');
      assert(!dates.has(day.date), 'Duplicate date');
      dates.add(day.date);
      assert(Number.isInteger(day.weekday) && day.weekday >= 0 && day.weekday <= 6 && date.getUTCDay() === day.weekday, 'Invalid weekday');
      assert(Number.isSafeInteger(day.contributionCount) && day.contributionCount >= 0, 'Invalid contribution count');
      assert(levels.includes(day.contributionLevel), 'Invalid contribution level');
      if (day.contributionCount > 0) active.add(day.weekday);
      total += day.contributionCount;
    }
    return { total, active, first: week.contributionDays[0].date, last: week.contributionDays.at(-1).date };
  });
  const days = calendar.weeks.flatMap((week) => week.contributionDays);
  assert(days.length <= 378, 'Invalid contribution days');
  assert.equal(weeks.reduce((sum, week) => sum + week.total, 0), calendar.totalContributions, 'Calendar total does not match its days');
  assert(days.every((day, index) => index === 0 || day.date > days[index - 1].date), 'Calendar dates must be chronological');

  const max = Math.max(1, ...weeks.map((week) => week.total));
  const step = Math.min(28, 1440 / weeks.length);
  const start = (1536 - step * weeks.length) / 2;
  const facades = ['#424974', '#544876', '#3e526f', '#574d85', '#3e4477'];
  const buildings = weeks.map((week, index) => {
    const x = Math.round(start + index * step);
    const width = Math.floor(step - 3);
    // A square-root scale keeps quiet weeks visible without changing their rank.
    const height = 62 + Math.round(214 * Math.sqrt(week.total / max));
    const top = 558 - height;
    const windows = [];
    const litWindows = [];
    for (let row = 0; row < Math.floor((height - 16) / 11); row++) {
      for (let column = 0; column < 2; column++) {
        const weekday = (row * 2 + column) % 7;
        const lit = week.active.has(weekday);
        const fill = lit ? ((weekday + index) % 3 ? '#ffce8d' : '#b9eee9') : '#252c55';
        (lit ? litWindows : windows).push(`<rect x="${4 + column * 8}" y="${height - 14 - row * 11}" width="4" height="5" fill="${fill}"/>`);
      }
    }
    const roof = index % 4 === 0 && height > 95
      ? `<rect x="6" y="-8" width="${width - 11}" height="8" fill="#363e69"/><path d="M9-8v-6" stroke="#a5b0d6" stroke-width="2"/><rect x="8" y="-16" width="2" height="2" fill="#ecc1e8" class="beacon"/>`
      : '';
    return `<g class="week-building" data-week="${index + 1}" data-contributions="${week.total}" data-active-days="${week.active.size}" data-height="${height}" transform="translate(${x} ${top})"><title>${week.first} to ${week.last}: ${week.total} contributions, ${week.active.size} active days</title>
<rect x="2" y="3" width="${width}" height="${height - 3}" fill="#0a1026" opacity=".45"/>
<rect width="${width}" height="${height}" fill="${facades[index % facades.length]}"/>
<rect x="${width - 4}" width="4" height="${height}" fill="#252d54"/>
<rect width="${width}" height="3" fill="#9398cf"/><rect y="4" width="2" height="${height - 4}" fill="#7b7fae" opacity=".5"/>
${Array.from({ length: Math.floor(height / 22) }, (_, floor) => `<path d="M1 ${height - floor * 22 - 1}h${width - 5}" stroke="#272e54" opacity=".5"/>`).join('')}
${windows.join('')}${litWindows.length ? `<g class="lit w${index % 3}">${litWindows.join('')}</g>` : ''}${roof}<rect x="9" y="${height - 7}" width="5" height="7" fill="#171f3e"/>
</g>`;
  }).join('\n');

  const stars = [[100,94],[232,48],[419,118],[593,49],[724,142],[925,73],[1126,139],[1320,45],[1464,104]];
  const sparkles = stars.map(([x,y], i) => `<g class="star s${i % 3}" transform="translate(${x} ${y})" fill="${i % 2 ? '#d4d8ff' : '#f8dfb1'}"><path d="M-4-1h8v2h-8zM-1-4h2v8h-2z"/></g>`).join('');
  const trees = [93,277,482,696,903,1119,1357].map((x,i) => `<g transform="translate(${x} 540)" shape-rendering="crispEdges"><path d="M-2 0h4v22h-4" fill="#4d3d54"/><path d="M-12-4h7v-7h13v5h7v12h-7v5H-6V7h-9V0h3z" fill="#152e46"/><path d="M-7-7h7v-2h8v6h4v5H-4V5h-6V0h3z" fill="#254b56"/><path d="M-5-6h4v3h-4zm10 3h4v3H5z" fill="${i % 2 ? '#426065' : '#496d70'}"/></g>`).join('');
  const car = '<g shape-rendering="crispEdges"><path d="M3 8h5V3h17v5h6v8H1v-6h2z" fill="#5268a2"/><path d="M10 4h6v5h-8zm8 0h6l3 5h-9z" fill="#b9eee9"/><path d="M2 12h28v3H2z" fill="#384d83"/><rect x="28" y="10" width="4" height="3" fill="#ffe5ad"/><rect y="10" width="3" height="3" fill="#da82a1"/><path d="M6 14h5v5H6zm16 0h5v5h-5z" fill="#101a34"/><path d="M7 15h3v2H7zm16 0h3v2h-3z" fill="#8995bb"/></g>';
  const wolf = '<g class="wolf-facing" shape-rendering="crispEdges"><g class="wolf-tail"><path d="M8 8H3V5H0v7h3v3h7z" fill="#c4d3f1"/><path d="M0 5h3v4H0z" fill="#fafaff"/></g><path d="M8 7h16v-3h3V0h2v3h3V1h2v6h3v5h-4v3h-9v-2H10v2H7V9h1z" fill="#ebefff"/><path d="M9 12h15v3H10zM28 12h5v3h-5z" fill="#b4c5e6"/><path class="leg-a" d="M10 13h3v8H9v-2h1zm15 0h3v8h-4v-2h1z" fill="#f7f8ff"/><path class="leg-b" d="M14 13h3v7h-4v-2h1zm15 0h3v7h-4v-2h1z" fill="#a9bddf"/><path d="M29 4h1v2h-1zm4 0h1v2h-1z" fill="#a6b9df"/><path class="wolf-eye" d="M31 7h2v2h-2z" fill="#45b9ff"/><path d="M36 9h2v2h-2z" fill="#1a2443"/></g>';
  const first = days[0].date;
  const last = days.at(-1).date;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="768" viewBox="0 0 1536 768" role="img" aria-labelledby="title desc">
<title id="title">Penzragon's contribution city</title>
<desc id="desc">${calendar.totalContributions} contributions from ${first} to ${last}. ${weeks.length} buildings represent consecutive weeks, oldest on the left. Height uses a relative square-root scale for weekly contribution volume; window patterns reflect active weekdays. Cars and a white wolf move along the waterfront. Refreshed daily; no private repository names are included.</desc>
<defs>
<linearGradient id="skyShade" x2="0" y2="1"><stop stop-color="#050d28" stop-opacity=".6"/><stop offset="1" stop-color="#050d28" stop-opacity="0"/></linearGradient>
<linearGradient id="fade" x2="0" y2="1"><stop stop-color="white" stop-opacity=".6"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>
<pattern id="ripple" width="22" height="8" patternUnits="userSpaceOnUse"><rect width="22" height="3" fill="white"/><rect x="4" y="5" width="15" height="1" fill="white"/></pattern>
<mask id="waterFade"><rect x="0" y="622" width="1536" height="127" fill="url(#fade)"/></mask>
<mask id="waterLines"><rect x="0" y="622" width="1536" height="127" fill="url(#ripple)"/></mask>
</defs>
<style>
text{font-family:monospace;fill:#e5e9ff}.lit{animation:window 7s ease-in-out infinite alternate}.w1{animation-delay:-2s}.w2{animation-delay:-4s}.star{animation:twinkle 4s ease-in-out infinite alternate}.s1{animation-delay:-1.4s}.s2{animation-delay:-2.8s}.car-east{animation:drive 52s linear infinite}.car-west{animation:driveBack 67s linear infinite}.wolf-travel{animation:stroll 96s linear infinite}.wolf-facing{animation:face 96s steps(1,end) infinite;transform-origin:19px 11px}.wolf-tail{animation:wag 2s steps(3,end) infinite alternate;transform-origin:8px 10px}.wolf-eye{animation:blink 7s steps(1,end) infinite}.leg-a{animation:step .8s steps(2,end) infinite alternate}.leg-b{animation:step .8s steps(2,end) infinite alternate-reverse}.reflection{animation:shimmer 5s steps(5,end) infinite alternate}.cloud{animation:drift 32s ease-in-out infinite alternate}.beacon{animation:twinkle 6s ease-in-out infinite alternate}
@keyframes window{from{opacity:.55}to{opacity:1}}@keyframes twinkle{from{opacity:.12}to{opacity:.9}}@keyframes drive{from{transform:translateX(-65px)}to{transform:translateX(1560px)}}@keyframes driveBack{from{transform:translateX(1560px)}to{transform:translateX(-65px)}}
@keyframes stroll{0%,2%{transform:translateX(120px)}48%,52%{transform:translateX(1380px)}98%,100%{transform:translateX(120px)}}@keyframes face{0%,49%{transform:scaleX(1)}50%,99%{transform:scaleX(-1)}100%{transform:scaleX(1)}}
@keyframes wag{from{transform:rotate(-7deg)}to{transform:rotate(9deg)}}@keyframes blink{0%,44%,48%,100%{opacity:1}45%,47%{opacity:0}}@keyframes step{from{transform:translateX(-1px)}to{transform:translateX(1px)}}@keyframes shimmer{from{transform:translateX(-3px);opacity:.23}to{transform:translateX(4px);opacity:.4}}@keyframes drift{from{transform:translateX(-12px);opacity:.12}to{transform:translateX(18px);opacity:.22}}
@media(prefers-reduced-motion:reduce){*{animation:none!important}.car-east{transform:translateX(350px)}.car-west{transform:translateX(1100px)}.wolf-travel{transform:translateX(745px)}.reflection{opacity:.3}}
</style>
<image width="1536" height="768" preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,${sky}"/>
<rect width="1536" height="180" fill="url(#skyShade)"/>
<text x="768" y="57" text-anchor="middle" font-size="27" font-weight="bold">A year, built one week at a time</text>
<text x="768" y="88" text-anchor="middle" font-size="16">${calendar.totalContributions.toLocaleString('en-US')} contributions · ${first} — ${last}</text>
${sparkles}
<g class="cloud" fill="#7d80c9" shape-rendering="crispEdges"><path d="M188 210h24v-9h24v-7h42v8h29v9h26v7H188zM878 177h26v-7h37v-7h25v7h32v9h19v7H878z"/></g>
<g id="buildings" shape-rendering="crispEdges">${buildings}</g>
<g mask="url(#waterFade)"><g mask="url(#waterLines)"><g class="reflection"><use href="#buildings" transform="translate(0 873.1) scale(1 -.45)"/></g></g></g>
${trees}
<g class="car-east"><g transform="translate(0 556) scale(1.25)">${car}</g></g>
<g class="car-west"><g transform="translate(0 567) scale(-1.1 1.1)">${car}</g></g>
<g class="wolf-travel"><g transform="translate(0 551) scale(1.25)">${wolf}</g></g>
<rect x="236" y="701" width="1064" height="50" rx="6" fill="#09122d" opacity=".88"/>
<text x="768" y="722" text-anchor="middle" font-size="15">1 building = 1 week · Height = contribution volume · Window glow = active days</text>
<text x="768" y="742" text-anchor="middle" font-size="12">Oldest weeks on the left → newest on the right · Refreshed daily</text>
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
  console.log('Updated contribution city from GitHub; no repository names or private project details stored.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await update();
