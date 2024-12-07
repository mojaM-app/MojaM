import { FormArray, FormControl } from '@angular/forms';
import { DateUtils } from 'src/utils/date.utils';
import { IAnnouncementsForm } from '../announcements-form/announcements.form';
import { IAnnouncements } from '../interfaces/announcements';
import { AnnouncementItemDto, AnnouncementsDto } from './announcements.model';

export class EditAnnouncementsDto extends AnnouncementsDto {
  public id?: string;

  public constructor(
    id: string,
    formControls?: { [K in keyof IAnnouncementsForm]: FormControl<any> }
  ) {
    super();
    this.id = id;
    this.items = [];

    if (formControls) {
      this.validFromDate = formControls.validFromDate?.value ?? undefined;
      if (this.validFromDate) {
        this.validFromDate = DateUtils.toUtcDate(this.validFromDate);
      }

      const items = formControls.items as any as FormArray;
      items?.controls?.forEach((item: any) => {
        this.items?.push({
          content: item.controls.content.value ?? undefined,
        } satisfies AnnouncementItemDto);
      });
    }
  }

  public static create(announcements: IAnnouncements): EditAnnouncementsDto {
    const result = new EditAnnouncementsDto(announcements.id);
    result.validFromDate = announcements.validFromDate;
    result.items = (announcements.items ?? []).map(
      item =>
        ({
          content: item.content,
        }) satisfies AnnouncementItemDto
    );
    return result;
  }
}
