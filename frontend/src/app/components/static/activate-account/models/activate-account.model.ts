import { FormGroup } from '@angular/forms';
import { IActivateAccountForm } from '../activate-account.form';
import { AuthenticationTypes } from '../enums/authentication-type.enum';

export class ActivateAccountDto {
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly joiningDate: Date | null;
  public readonly authenticationType: AuthenticationTypes;
  public readonly password: string | null;
  public readonly pin: string | null;

  public constructor(formGroup: FormGroup<IActivateAccountForm>) {
    this.firstName = formGroup.controls.personalInfo?.controls.firstName?.value ?? null;
    this.lastName = formGroup.controls.personalInfo?.controls.lastName?.value ?? null;
    this.joiningDate = formGroup.controls.personalInfo?.controls.joiningDate?.value ?? null;
    this.authenticationType =
      formGroup.controls.authentication?.controls.authenticationType?.value ??
      AuthenticationTypes.Password;
    this.password = formGroup.controls.authentication?.controls.password?.value ?? null;
    this.pin = formGroup.controls.authentication?.controls.pin?.value ?? null;
  }
}
