import { FormGroup } from '@angular/forms';
import { DateUtils } from 'src/utils/date.utils';
import {
  IActivateAccountForm,
  SetPasswordFormGroupControlNames,
  UserInfoFormGroupControlNames,
} from '../activate-account.form';

export class ActivateUserDto {
  public firstName: string | null;
  public lastName: string | null;
  public joiningDate: Date | null;
  public password!: string;

  public constructor(formGroups: { [K in keyof IActivateAccountForm]: FormGroup<any> }) {
    this.firstName =
      formGroups?.userInfo?.controls[UserInfoFormGroupControlNames.firstName]?.value ?? null;
    this.lastName =
      formGroups?.userInfo?.controls[UserInfoFormGroupControlNames.lastName]?.value ?? null;
    this.joiningDate =
      formGroups?.userInfo?.controls[UserInfoFormGroupControlNames.joiningDate]?.value ?? null;
    if (this.joiningDate) {
      this.joiningDate = DateUtils.toUtcDate(this.joiningDate);
    }
    this.password =
      formGroups?.setPassword?.controls[SetPasswordFormGroupControlNames.password]?.value ?? '';
  }
}
