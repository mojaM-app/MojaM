import { FormControl } from '@angular/forms';
import { IUserForm } from '../user.form';
import { UserDto } from './user.model';

export class EditUserDto extends UserDto {
  public readonly id: string;

  public constructor(id: string, formControls: { [K in keyof IUserForm]: FormControl<any> }) {
    super(formControls);
    this.id = id;
  }
}
