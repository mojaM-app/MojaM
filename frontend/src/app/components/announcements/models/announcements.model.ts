export abstract class AnnouncementsDto {
  public validFromDate: Date | null = null;
  public items: AnnouncementItemDto[] = [];
}

export class AnnouncementItemDto {
  public id?: string;
  public content: string | null = null;
}
