import { FormControl } from '@angular/forms';
import { DateUtils } from 'src/utils/date.utils';
import { IUserProfileForm } from '../user-profile.form';

export class UpdateUserProfileDto {
  public firstName?: string | null;
  public lastName?: string | null;
  public joiningDate?: Date | null;

  public constructor(formControls: { [K in keyof IUserProfileForm]: FormControl<any> }) {
    this.firstName = formControls?.firstName?.value ?? null;
    this.lastName = formControls?.lastName?.value ?? null;
    this.joiningDate = formControls?.joiningDate?.value ?? null;
    if (this.joiningDate) {
      this.joiningDate = DateUtils.toUtcDate(this.joiningDate);
    }
  }
}
