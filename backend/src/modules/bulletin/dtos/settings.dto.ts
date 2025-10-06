import { IsNotEmpty } from 'class-validator';

export class BulletinSectionSettingsDto {
  @IsNotEmpty()
  public includeInPdf!: boolean;

  @IsNotEmpty()
  public expanded!: boolean;
}

export class BulletinDaySettingsDto {
  @IsNotEmpty()
  public showTitleInPdf!: boolean;
}
