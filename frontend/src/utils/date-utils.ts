export class DateUtils {
  public static toUtcDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    );
  }
}
