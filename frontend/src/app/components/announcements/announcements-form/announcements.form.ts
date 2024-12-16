import { FormArray, FormControl, FormGroup } from '@angular/forms';

export interface IAnnouncementsItemForm {
  id: FormControl<string | undefined>;
  content: FormControl<string | null>;
}

export const AnnouncementItemFormControlNames: { [K in keyof IAnnouncementsItemForm]: string } = {
  id: 'id',
  content: 'content',
} as const;

export interface IAnnouncementsForm {
  validFromDate: FormControl<Date | null>;
  items: FormArray<FormGroup<IAnnouncementsItemForm>>;
}
export const AnnouncementsFormControlNames: { [K in keyof IAnnouncementsForm]: string } = {
  validFromDate: 'validFromDate',
  items: 'items',
} as const;
