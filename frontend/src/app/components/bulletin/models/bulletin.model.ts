import { SectionType } from '../enums/section-type.enum';

export class BulletinDaySectionDto {
  public id?: string;
  public order: number | null = null;
  public type: SectionType = SectionType.CUSTOM_TEXT;
  public title: string | null = null;
  public content: string | null = null;
}

export class BulletinDayDto {
  public id?: string;
  public date: Date | null = null;
  public title: string | null = null;
  public sections: BulletinDaySectionDto[] = [];
}

export abstract class BulletinDto {
  public date: Date | null = null;
  public title: string | null = null;
  public number: number | null = null;
  public introduction: string | null = null;
  public tipsForWork: string | null = null;
  public dailyPrayer: string | null = null;
  public days: BulletinDayDto[] = [];
}
