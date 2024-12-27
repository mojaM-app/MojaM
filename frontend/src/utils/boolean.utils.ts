export class BooleanUtils {
  public static toBoolean(value: any): boolean {
    return value === 1 || value === true || value === 'true' || value === '1';
  }
}
