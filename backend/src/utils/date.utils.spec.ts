import { getDateNow, getDateTimeNow, isDate } from './date.utils';

describe('isDate', () => {
  it('should return false for null value', () => {
    expect(isDate(null)).toBe(false);
  });

  it('should return false for undefined value', () => {
    expect(isDate(undefined)).toBe(false);
  });

  it('should return false for non-date value', () => {
    expect(isDate('2022-01-01')).toBe(false);
    expect(isDate(123)).toBe(false);
    expect(isDate({})).toBe(false);
    expect(isDate([])).toBe(false);
    expect(isDate(() => {})).toBe(false);
  });

  it('should return true for valid date', () => {
    const date = new Date('2022-01-01');
    expect(isDate(date)).toBe(true);
  });
});

describe('getDateTimeNow', () => {
  it('should return current date and time', () => {
    const now = new Date();
    const expectedDateTimeNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    const dateTimeNow = getDateTimeNow();
    expect(dateTimeNow).toEqual(expectedDateTimeNow);
  });
});

describe('getDateNow', () => {
  it('should return current date', () => {
    const now = new Date();
    const expectedDateNow = new Date(now.toISOString().slice(0, 10));
    const dateNow = getDateNow();
    expect(dateNow).toEqual(expectedDateNow);
  });
});
