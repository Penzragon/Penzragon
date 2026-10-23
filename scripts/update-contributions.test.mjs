import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderCalendar } from './update-contributions.mjs';

const day = { date: '2026-10-23', weekday: 5, contributionCount: 3, contributionLevel: 'SECOND_QUARTILE' };
const calendar = { totalContributions: 3, weeks: [{ contributionDays: [day] }] };

test('renders actual counts and dates, including an empty activity day', () => {
  const svg = renderCalendar(calendar);
  assert.match(svg, /2026-10-23: 3 contributions/);
  assert.match(svg, /fill="#6265b8"/);
  assert.match(svg, /3 contributions/);
  assert.match(renderCalendar({ totalContributions: 0, weeks: [{ contributionDays: [{ ...day, contributionCount: 0, contributionLevel: 'NONE' }] }] }), /0 contributions/);
});

test('rejects malformed API data and mismatched totals before replacing the saved calendar', () => {
  for (const bad of [undefined, { ...calendar, totalContributions: 4 }, { ...calendar, weeks: [] }, { ...calendar, weeks: [{ contributionDays: [day, day] }] }, ...[{ contributionCount: -1 }, { weekday: 7 }, { date: '<script>' }, { contributionLevel: 'unknown' }].map((change) => ({ ...calendar, weeks: [{ contributionDays: [{ ...day, ...change }] }] }))]) {
    assert.throws(() => renderCalendar(bad));
  }
});
