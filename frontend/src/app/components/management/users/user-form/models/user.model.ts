import { FormControl } from '@angular/forms';
import { IUser } from 'src/core/interfaces/users/user.interfaces';
import { IUserForm } from '../user.form';

export abstract class UserDto {
  public email!: string;
  public phone!: string;
  public firstName?: string | null;
  public lastName?: string | null;
  public joiningDate?: Date | null;

  public constructor(formControls: { [K in keyof IUserForm]: FormControl<any> }) {
    this.email = formControls?.email?.value ?? null;
    this.phone = formControls?.phone?.value ?? null;
    this.firstName = formControls?.firstName?.value ?? null;
    this.lastName = formControls?.lastName?.value ?? null;
    this.joiningDate = formControls?.joiningDate?.value ?? null;
  }

  public static empty(): IUser {
    return {
      id: '',
      email: '',
      phone: '',
    } satisfies IUser;
  }
}
