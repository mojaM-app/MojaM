import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers/DtoTransformFunctions';
import { IResponse } from '@interfaces';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';
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
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @IsString({
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: errorKeys.login.Invalid_Login_Or_Password,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
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
