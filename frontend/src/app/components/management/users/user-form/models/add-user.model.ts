import { UserDto } from './user.model';

export class AddUserDto extends UserDto {
  public constructor() {
    super();
  }

  public static create(): AddUserDto {
    return new AddUserDto();
  }
}
