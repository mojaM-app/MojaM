export class DateUtils {
  public static toUtcDate(date: Date): Date {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  }

  public static toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  public static getMonthBounds(date: Date = new Date()): { firstDay: Date; lastDay: Date } {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { firstDay, lastDay };
  }
}
