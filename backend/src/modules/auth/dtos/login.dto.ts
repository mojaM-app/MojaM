import { VALIDATOR_SETTINGS } from '@config';
import { DtoTransformFunctions, events, ILoginModel, IResponse, TLoginResult } from '@core';
import { errorKeys } from '@exceptions';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';
import { ILoginResult } from '../interfaces/login.interfaces';

export class LoginDto implements ILoginModel {
  @IsNotEmpty({
    message: errorKeys.login.Invalid_Login_Or_Passcode,
  })
  @IsString({
    message: errorKeys.login.Invalid_Login_Or_Passcode,
  })
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: errorKeys.login.Invalid_Login_Or_Passcode,
  })
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public email: string | null | undefined;

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_Phone,
  })
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Phone,
  })
  @IsPhoneNumber(VALIDATOR_SETTINGS.PHONE_COUNTRY_CODE, {
    message: errorKeys.users.Invalid_Phone,
  })
  @MaxLength(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH, {
    message: errorKeys.users.Phone_Too_Long,
  })
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public phone?: string;

  @IsNotEmpty({
    message: errorKeys.login.Invalid_Login_Or_Passcode,
  })
  @IsString({
    message: errorKeys.login.Invalid_Login_Or_Passcode,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: errorKeys.login.Invalid_Login_Or_Passcode,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public passcode: string | null | undefined;
}

export class LoginResponseDto implements IResponse<TLoginResult> {
  public readonly data: TLoginResult;
  public readonly message: string;

  constructor(loginResult: ILoginResult) {
    this.data = {
      id: loginResult.user.id,
      email: loginResult.user.email,
      phone: loginResult.user.phone,
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
    } satisfies TLoginResult;
    this.message = events.users.userLoggedIn;
  }
}
