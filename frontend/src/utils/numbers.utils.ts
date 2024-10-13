/* eslint-disable @typescript-eslint/no-explicit-any */
export class NumbersUtils {
  public static parse(value: any): number | null {
    if (typeof value === 'number') {
      if (isFinite(value)) {
        return value;
      } else {
        return null;
      }
    }

    if (typeof value === 'string') {
      if (value === null || value === undefined || !(value + '').trim().length) {
        return null;
      }

      value = (value + '').trim().replace(',', '.').replace(/\s/g, '');

      return value == value * 1 ? NumbersUtils.parse(value * 1) : null;
    }

    return null;
  }
}
