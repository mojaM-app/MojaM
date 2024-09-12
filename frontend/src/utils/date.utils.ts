export class DateUtils {
  public static toUtcDate(date: Date): Date {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  }

  public static toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
