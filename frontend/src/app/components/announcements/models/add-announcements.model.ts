import { FormArray, FormControl } from '@angular/forms';
import { IAnnouncementsForm } from '../announcements-form/announcements.form';
import { IAnnouncements } from '../interfaces/announcements';
import { AnnouncementItemDto, AnnouncementsDto } from './announcements.model';

export class AddAnnouncementsDto extends AnnouncementsDto {
  public constructor(formControls?: {
    [K in keyof IAnnouncementsForm]: FormControl<any> | FormArray<any>;
  }) {
    super(formControls);
  }

  public set(announcements: IAnnouncements): void {
    this.validFromDate = announcements?.validFromDate ?? null;
    this.items = (announcements.items ?? []).map(
      item =>
        ({
          content: item.content ?? null,
        }) satisfies AnnouncementItemDto
    );
  }

  public static create(): AddAnnouncementsDto {
    return new AddAnnouncementsDto();
  }
}
