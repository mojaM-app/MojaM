export class EditBulletinDto {
  public readonly id: string;
  public title?: string | null;
  public date?: Date | null;
  public number?: number | null;
  public introduction?: string | null;
  public tipsForWork?: string | null;
  public dailyPrayer?: string | null;

  public constructor(id: string) {
    this.id = id;
  }
}
