export class StringUtils {
  public static isString(value: unknown): boolean {
    return typeof value === 'string';
  }

  public static isEmpty(value: unknown): boolean {
    return StringUtils.isString(value) && (value as string).trim().length === 0;
  }

  public static ciEquals(a: unknown, b: unknown): boolean {
    return typeof a === 'string' && typeof b === 'string'
      ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
      : a === b;
  }
}
