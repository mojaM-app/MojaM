import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  IAnnouncementsForm,
  IAnnouncementsItemForm,
} from '../announcements-form/announcements.form';
import { IAnnouncements } from '../interfaces/announcements';
import { AnnouncementItemDto, AnnouncementsDto } from './announcements.model';

export class AddAnnouncementsDto extends AnnouncementsDto {
  public constructor(formControls?: {
    [K in keyof IAnnouncementsForm]: FormControl<any> | FormArray<any>;
  }) {
    super();
    this.items = [];

    if (formControls) {
      this.validFromDate = formControls.validFromDate?.value ?? null;
      const items = formControls.items as FormArray<FormGroup<IAnnouncementsItemForm>>;
      items?.controls?.forEach((item: FormGroup<IAnnouncementsItemForm>) => {
        this.items!.push({
          content: item.controls.content?.value ?? null,
        } satisfies AnnouncementItemDto);
      });
    }
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
