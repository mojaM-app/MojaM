import { IUser } from 'src/interfaces/users/user.interfaces';
import { UserDto } from './user.model';

export class EditUserDto extends UserDto {
  public readonly id: string;

  public constructor(id: string) {
    super();
    this.id = id;
  }

  public static create(user: IUser): EditUserDto {
    const result = new EditUserDto(user.id);
    result.email = user.email;
    result.phone = user.phone;
    result.firstName = user.firstName;
    result.lastName = user.lastName;
    result.joiningDate = user.joiningDate;
    return result;
  }
}
