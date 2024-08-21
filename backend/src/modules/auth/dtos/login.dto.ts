import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { VALIDATOR_SETTINGS } from '@utils';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TLoginResult } from '../types/login.types';

export class LoginDto {
  @IsNotEmpty({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  public login: string | null | undefined;

  @IsNotEmpty({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  public password: string | null | undefined;
}

export class LoginResponseDto implements IResponse<TLoginResult> {
  data: TLoginResult;
  message?: string | undefined;

  public constructor(data: TLoginResult) {
    this.data = data;
    this.message = events.users.userLoggedIn;
  }
}
