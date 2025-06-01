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

  it('should return false for invalid dates', () => {
    expect(isDate(new Date('invalid date'))).toBe(false);
  });

  it('should handle date at DST transition boundaries', () => {
    const winterDate = new Date('2022-01-15T10:00:00');
    const summerDate = new Date('2022-07-15T10:00:00');
    const dstStartDate = new Date('2022-03-27T12:00:00');
    const dstEndDate = new Date('2022-10-30T12:00:00');

    expect(isDate(winterDate)).toBe(true);
    expect(isDate(summerDate)).toBe(true);
    expect(isDate(dstStartDate)).toBe(true);
    expect(isDate(dstEndDate)).toBe(true);
  });
});

describe('getDateTimeNow', () => {
  it('should return current date and time', () => {
    const now = new Date();
    const expectedDateTimeNow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    const dateTimeNow = getDateTimeNow();
    expect(dateTimeNow).toEqual(expectedDateTimeNow);
  });

  it('should truncate milliseconds', () => {
    const dateTimeNow = getDateTimeNow();
    expect(dateTimeNow.getMilliseconds()).toBe(0);
  });

  it('should maintain timezone information', () => {
    const beforeCall = new Date();
    const dateTimeNow = getDateTimeNow();

    expect(dateTimeNow.getTimezoneOffset()).toBe(beforeCall.getTimezoneOffset());

    const timezoneOffset = new Date().getTimezoneOffset();
    expect(dateTimeNow.getTimezoneOffset()).toBe(timezoneOffset);
  });
});

describe('getDateNow', () => {
  it('should return current date', () => {
    const now = new Date();
    const expectedDateNow = new Date(now.toISOString().slice(0, 10));
    const dateNow = getDateNow();
    expect(dateNow.toISOString().slice(0, 10)).toEqual(expectedDateNow.toISOString().slice(0, 10));
  });

  it('should create a date at midnight UTC', () => {
    // The implementation creates a date from ISO string which results in
    // a date object that represents midnight UTC converted to local time
    const dateNow = getDateNow();

    // Create a reference date at midnight UTC
    const midnightUTC = new Date();
    midnightUTC.setUTCHours(0, 0, 0, 0);

    // Only compare the hour that would result from a UTC midnight converted to local time
    const expectedHour = midnightUTC.getHours();
    expect(dateNow.getHours()).toBe(expectedHour);
    expect(dateNow.getMinutes()).toBe(0);
    expect(dateNow.getSeconds()).toBe(0);
    expect(dateNow.getMilliseconds()).toBe(0);
  });

  it('should handle DST transitions correctly', () => {
    const realDate = Date;
    const mockDstDate = new Date('2022-07-15T12:00:00');

    global.Date = jest.fn(() => mockDstDate) as any;
    (global.Date as any).UTC = realDate.UTC;
    (global.Date as any).parse = realDate.parse;
    (global.Date as any).now = realDate.now;

    (mockDstDate as any).toISOString = function (): string {
      return '2022-07-15T12:00:00.000Z';
    };

    const dstDateNow = getDateNow();

    global.Date = realDate;

    expect(dstDateNow.getFullYear()).toBe(2022);
    expect(dstDateNow.getMonth()).toBe(6); // July is 6 (zero-based)
    expect(dstDateNow.getDate()).toBe(15);

    // We can't expect a specific hour because it depends on the local timezone
    // Just verify that minutes, seconds, and milliseconds are zeroed out
    expect(dstDateNow.getMinutes()).toBe(0);
    expect(dstDateNow.getSeconds()).toBe(0);
    expect(dstDateNow.getMilliseconds()).toBe(0);
  });
});
