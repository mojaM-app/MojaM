import { FormControl } from '@angular/forms';
import { IUserForm } from '../user.form';
import { UserDto } from './user.model';

export class AddUserDto extends UserDto {
  public constructor(formControls: { [K in keyof IUserForm]: FormControl<any> }) {
    super(formControls);
  }
}
