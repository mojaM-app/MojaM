import { error_keys } from '@exceptions/error.keys';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({
    message: error_keys.users.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: error_keys.users.login.Invalid_Login_Or_Password,
  })
  @MaxLength(320, {
    message: error_keys.users.login.Invalid_Login_Or_Password,
  })
  public login: string;

  @IsNotEmpty({
    message: error_keys.users.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: error_keys.users.login.Invalid_Login_Or_Password,
  })
  @MaxLength(50, {
    message: error_keys.users.login.Invalid_Login_Or_Password,
  })
  public password: string;
}
