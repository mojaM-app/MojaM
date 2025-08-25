import { FormArray, FormControl } from '@angular/forms';
import { IAnnouncementsForm } from '../announcements-form/announcements.form';
import { IAnnouncements } from '../interfaces/announcements';
import { AnnouncementItemDto, AnnouncementsDto } from './announcements.model';

export class EditAnnouncementsDto extends AnnouncementsDto {
  public readonly id: string;

  public constructor(
    id: string,
    formControls?: { [K in keyof IAnnouncementsForm]: FormControl<any> | FormArray<any> }
  ) {
    super(formControls);
    this.id = id;
  }

  public static create(announcements: IAnnouncements): EditAnnouncementsDto {
    const result = new EditAnnouncementsDto(announcements.id);
    result.validFromDate = announcements.validFromDate ?? null;
    result.items = (announcements.items ?? []).map(
      item =>
        ({
          id: item.id,
          content: item.content,
        }) satisfies AnnouncementItemDto
    );
    return result;
  }
}
