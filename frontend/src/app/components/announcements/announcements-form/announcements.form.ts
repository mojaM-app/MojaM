import { FormArray, FormControl, FormGroup } from '@angular/forms';

export interface IAnnouncementsItemForm {
  id: FormControl<string | undefined>;
  content: FormControl<string | null>;
}

export interface IAnnouncementsForm {
  validFromDate: FormControl<Date | null>;
  items: FormArray<FormGroup<IAnnouncementsItemForm>>;
}
