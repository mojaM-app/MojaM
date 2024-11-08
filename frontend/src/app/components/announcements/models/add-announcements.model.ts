import { AnnouncementItemDto, AnnouncementsDto } from "./announcements.model";

export class AddAnnouncementsDto extends AnnouncementsDto {

  public constructor() {
    super();
    this.items = [];
  }

  public static create(): AddAnnouncementsDto {
    return new AddAnnouncementsDto().addItem();
  }

  private addItem(): AddAnnouncementsDto {
    this.items!.push(new AnnouncementItemDto());
    return this;
  }
}
