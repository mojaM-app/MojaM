import './date.extensions';

describe('addMonths', () => {
  it('should return same date for zero months', () => {
    const date = new Date('2022-01-01');
    const newDate = date.addMonths(0);
    expect(newDate).toEqual(date);
  });

  it('should return same date for null or undefined months', () => {
    const date = new Date('2022-01-01');
    const newDate1 = date.addMonths(null as any as number);
    const newDate2 = date.addMonths(undefined as any as number);
    expect(newDate1).toEqual(date);
    expect(newDate2).toEqual(date);
  });

  it('should return date with added months', () => {
    const date = new Date('2022-01-01'); // central european standard time
    const newDate = date.addMonths(3); // central european daylight time
    expect(newDate).toEqual(new Date('2022-04-01'));
  });

  it('should return date with subtracted months', () => {
    const date = new Date('2022-01-01'); // central european standard time
    const newDate = date.addMonths(-4); // central european daylight time
    expect(newDate).toEqual(new Date('2021-09-01'));
  });
});

describe('addDays', () => {
  it('should return same date for zero days', () => {
    const date = new Date('2022-01-01');
    const newDate = date.addDays(0);
    expect(newDate).toEqual(date);
  });

  it('should return same date for null or undefined days', () => {
    const date = new Date('2022-01-01');
    const newDate1 = date.addDays(null as any as number);
    const newDate2 = date.addDays(undefined as any as number);
    expect(newDate1).toEqual(date);
    expect(newDate2).toEqual(date);
  });

  it('should return date with added days', () => {
    const date = new Date('2022-03-31'); // central european standard time
    const newDate = date.addDays(1); // central european daylight time
    expect(newDate).toEqual(new Date('2022-04-01'));
  });

  it('should return date with subtracted days', () => {
    const date = new Date('2022-11-01'); // central european standard time
    const newDate = date.addDays(-21); // central european daylight time
    expect(newDate).toEqual(new Date('2022-10-11'));
  });
});
