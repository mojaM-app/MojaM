import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
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
  public email: string | null | undefined;

  public phone?: string;

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
  public readonly data: TLoginResult;
  public readonly message: string;

  public constructor(loginResult: TLoginResult) {
    this.data = loginResult;
    this.message = events.users.userLoggedIn;
  }
}
