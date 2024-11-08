import { FormArray, FormControl, FormGroup } from '@angular/forms';

export interface IAnnouncementsItemForm {
  content: FormControl<string | undefined>;
}

export const AnnouncementItemFormControlNames: { [K in keyof IAnnouncementsItemForm]: string } = {
  content: 'content',
} as const;



export interface IAnnouncementsForm {
  validFromDate: FormControl<Date | undefined>;
  items: FormArray<FormGroup<IAnnouncementsItemForm>>;
}
export const AnnouncementsFormControlNames: { [K in keyof IAnnouncementsForm]: string } = {
  validFromDate: 'validFromDate',
  items: 'items',
} as const;
