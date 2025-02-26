import { FormGroup } from '@angular/forms';
import { IActivateAccountForm } from '../activate-account.form';

export class ActivateUserDto {
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly joiningDate: Date | null;
  public readonly password!: string;

  public constructor(formGroup: FormGroup<IActivateAccountForm>) {
    this.firstName = formGroup.controls.userInfo?.controls.firstName?.value ?? null;
    this.lastName = formGroup.controls.userInfo?.controls.lastName?.value ?? null;
    this.joiningDate = formGroup.controls.userInfo?.controls.joiningDate?.value ?? null;
    this.password = formGroup.controls.setPassword?.controls.password?.value ?? '';
  }
}
