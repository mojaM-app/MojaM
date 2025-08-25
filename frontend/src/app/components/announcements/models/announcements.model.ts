import { FormControl, FormArray, FormGroup } from '@angular/forms';
import {
  IAnnouncementsForm,
  IAnnouncementsItemForm,
} from '../announcements-form/announcements.form';

export class AnnouncementItemDto {
  public id?: string;
  public content: string | null = null;
}

export abstract class AnnouncementsDto {
  public validFromDate: Date | null = null;
  public items: AnnouncementItemDto[] = [];

  protected constructor(formControls?: {
    [K in keyof IAnnouncementsForm]: FormControl<any> | FormArray<any>;
  }) {
    this.items = [];

    if (formControls) {
      this.validFromDate = formControls.validFromDate?.value ?? null;
      const items = formControls.items as FormArray<FormGroup<IAnnouncementsItemForm>>;
      items?.controls?.forEach((item: FormGroup<IAnnouncementsItemForm>) => {
        this.items!.push({
          id: item.controls.id?.value ?? undefined,
          content: item.controls.content?.value ?? null,
        } satisfies AnnouncementItemDto);
      });
    }
  }
}
