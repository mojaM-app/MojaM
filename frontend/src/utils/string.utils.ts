export class StringUtils {
  public static isString(value: any): boolean {
    return typeof value === 'string';
  }

  public static isEmpty(value: any): boolean {
    return StringUtils.isString(value) && value.trim().length === 0;
  }

  public static ciEquals(a: any, b: any) : boolean {
    return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
        : a === b;
}
}
