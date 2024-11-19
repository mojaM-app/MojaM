import { FormArray, FormControl } from '@angular/forms';
import { DateUtils } from 'src/utils/date.utils';
import { IAnnouncementsForm } from '../announcements-form/announcements.form';
import { AnnouncementItemDto, AnnouncementsDto } from './announcements.model';

export class AddAnnouncementsDto extends AnnouncementsDto {
  public constructor(formControls?: { [K in keyof IAnnouncementsForm]: FormControl<any> }) {
    super();
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

  public static create(): AddAnnouncementsDto {
    return new AddAnnouncementsDto().addItem();
  }

  private addItem(): AddAnnouncementsDto {
    this.items!.push(new AnnouncementItemDto());
    return this;
  }
}
