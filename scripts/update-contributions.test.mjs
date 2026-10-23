import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderCalendar } from './update-contributions.mjs';

function calendar(counts) {
  return {
    totalContributions: counts.flat().reduce((sum, count) => sum + count, 0),
    weeks: counts.map((week, index) => ({
      contributionDays: week.map((count, weekday) => ({
        date: new Date(Date.UTC(2026, 9, 4 + index * 7 + weekday)).toISOString().slice(0, 10),
        weekday,
        contributionCount: count,
        contributionLevel: count ? 'FIRST_QUARTILE' : 'NONE',
      })),
    })),
  };
}

function city(counts) {
  return renderCalendar(calendar(counts)).replace(/<image\b[^>]*\/>/g, '');
}

test('one building per week preserves actual counts, active days and volume ordering', () => {
  const svg = city([[0, 1, 0, 2, 0, 0, 0], [4, 5, 6, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]]);
  const buildings = [...svg.matchAll(/class="week-building" data-week="(\d+)" data-contributions="(\d+)" data-active-days="(\d+)" data-height="(\d+)"/g)].map((match) => match.slice(1).map(Number));
  assert.equal(buildings.length, 3);
  assert.deepEqual(buildings.map(([week, count, active]) => [week, count, active]), [[1, 3, 2], [2, 15, 3], [3, 0, 0]]);
  assert(buildings[1][3] > buildings[0][3] && buildings[0][3] > buildings[2][3]);
  assert.match(svg, /18 contributions from 2026-10-04 to 2026-10-24/);
  assert.match(svg, /2026-10-04 to 2026-10-10: 3 contributions, 2 active days/);
  assert.match(svg, /prefers-reduced-motion:reduce/);
});

test('quiet weeks and partial current weeks do not invent activity or create invalid geometry', () => {
  const empty = city([[0, 0, 0, 0, 0, 0, 0]]);
  assert.match(empty, /data-contributions="0" data-active-days="0" data-height="62"/);
  assert.doesNotMatch(empty, /class="lit w/);
  const partial = city([[2, 0, 3]]);
  assert.match(partial, /5 contributions from 2026-10-04 to 2026-10-06/);
  assert.match(partial, /data-active-days="2"/);
  const quietSaturday = city([[10000, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1]]);
  assert.match(quietSaturday.match(/data-week="2"[\s\S]*?<\/g>/)[0], /class="lit w/);
  const full = city(Array.from({ length: 54 }, (_, i) => [i, 0, 1, 0, 0, 0, 0]));
  assert.equal([...full.matchAll(/class="week-building"/g)].length, 54);
  assert.doesNotMatch(full, /(?:NaN|Infinity)/);
});

test('malformed API results are rejected before the saved city is replaced', () => {
  const valid = calendar([[0, 1, 2, 0, 0, 0, 0]]);
  const day = valid.weeks[0].contributionDays[1];
  for (const bad of [
    undefined,
    { ...valid, totalContributions: 4 },
    { ...valid, weeks: [] },
    { ...valid, weeks: [{ contributionDays: [day, day] }] },
    ...[{ contributionCount: -1 }, { weekday: 7 }, { weekday: 4 }, { date: '<script>' }, { date: '2026-02-30' }, { contributionLevel: 'unknown' }]
      .map((change) => ({ totalContributions: 1, weeks: [{ contributionDays: [{ ...day, ...change }] }] })),
    { ...valid, weeks: [{ contributionDays: [...valid.weeks[0].contributionDays].reverse() }] },
  ]) assert.throws(() => renderCalendar(bad));
});
