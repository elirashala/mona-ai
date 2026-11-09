import { describe, expect, it } from 'vitest';
import {
  parseIsoDate,
  previousMonth,
  reportRange,
} from '../src/utils/report-range';

describe('report date ranges', () => {
  it('defaults to the previous calendar month using the local business timezone', () => {
    expect(previousMonth(new Date('2026-11-09T10:00:00Z'))).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
    expect(reportRange({}, new Date('2026-01-01T12:00:00Z'))).toEqual({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    });
    expect(previousMonth(new Date('2026-10-31T23:30:00Z'))).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });
    expect(previousMonth(new Date('2024-03-01T10:00:00Z'))).toEqual({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });
  });
  it('accepts same-day ranges and the original March report as a normal custom range', () => {
    expect(
      reportRange({ startDate: '2026-03-31', endDate: '2026-03-31' }),
    ).toEqual({ startDate: '2026-03-31', endDate: '2026-03-31' });
    expect(
      reportRange({ startDate: '2026-03-01', endDate: '2026-03-31' }),
    ).toEqual({ startDate: '2026-03-01', endDate: '2026-03-31' });
    expect(parseIsoDate('0001-01-01')?.getUTCFullYear()).toBe(1);
  });
  it.each([
    '2026-02-29',
    '2026-04-31',
    '2026-13-01',
    '0000-01-01',
    '2026-3-1',
    '',
    '2026-03-01T00:00:00Z',
  ])('rejects invalid calendar date %s', (value) => {
    expect(() =>
      reportRange({ startDate: value, endDate: '2026-12-31' }),
    ).toThrow();
  });
  it('rejects reversed, partial and repeated query values', () => {
    expect(() =>
      reportRange({ startDate: '2026-03-31', endDate: '2026-03-01' }),
    ).toThrow(/before/);
    expect(() => reportRange({ startDate: '2026-03-01' })).toThrow();
    expect(() =>
      reportRange({ startDate: ['2026-03-01'], endDate: '2026-03-31' }),
    ).toThrow();
  });
});
