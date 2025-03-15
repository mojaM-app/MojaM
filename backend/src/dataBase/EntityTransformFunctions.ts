/* eslint-disable @typescript-eslint/no-extraneous-class */
import { toBoolean } from './../utils/boolean.utils';
import { isDate } from './../utils/date.utils';
import { toNumber } from './../utils/numbers.utils';

export abstract class EntityTransformFunctions {
  public static anyToAny = (value: any): any => value;

  public static anyToNumber = (value: any): number => toNumber(value) ?? 0;
  public static anyToNumberOrNull = (value: any): number | null => toNumber(value);

  public static stringDateToDate = (value?: string): Date | null => {
    return (value?.length ?? 0) > 0 ? new Date(value + 'T00:00:00Z') : null;
  };

  /**
   * Convert the Date to YYYY-MM-DD
   */
  public static dateToStringDate = (value: Date | null): string | null => {
    return isDate(value) ? value!.toISOString().slice(0, 10) : null;
  };

  public static anyToBoolean = (value: any): boolean => toBoolean(value);
}
