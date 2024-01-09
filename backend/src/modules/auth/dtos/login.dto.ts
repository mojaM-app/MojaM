import { error_keys } from '@exceptions';
import { VALIDATOR_SETTINGS } from '@utils';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({
    message: error_keys.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: error_keys.login.Invalid_Login_Or_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: error_keys.login.Invalid_Login_Or_Password,
  })
  public login: string;

  @IsNotEmpty({
    message: error_keys.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: error_keys.login.Invalid_Login_Or_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: error_keys.login.Invalid_Login_Or_Password,
  })
  public password: string;
}
