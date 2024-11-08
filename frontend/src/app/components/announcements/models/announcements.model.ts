export abstract class AnnouncementsDto {
  public validFromDate?: Date;
  public items?: AnnouncementItemDto[];
}

export class AnnouncementItemDto {
  public content?: string;
}
