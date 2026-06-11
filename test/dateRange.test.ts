import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { monthsAgoIso } from '../src/dateRange';

describe('monthsAgoIso', () => {
  it('returns an ISO date around the requested month window', () => {
    assert.equal(monthsAgoIso(3, new Date('2026-06-10T12:00:00.000Z')), '2026-03-10T12:00:00.000Z');
  });

  it('clamps month-end overflow to the previous month end', () => {
    assert.equal(monthsAgoIso(1, new Date('2026-03-31T12:00:00.000Z')), '2026-02-28T12:00:00.000Z');
  });
});
