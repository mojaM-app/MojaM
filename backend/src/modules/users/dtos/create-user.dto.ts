import { error_keys } from '@exceptions';
import { BasePayload } from '@modules/common';
import { VALIDATOR_SETTINGS } from '@utils';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: error_keys.users.Invalid_Email,
  })
  @IsNotEmpty({
    message: error_keys.users.Invalid_Email,
  })
  @IsEmail(
    {},
    {
      message: error_keys.users.Invalid_Email,
    },
  )
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: error_keys.users.Email_To_Long,
  })
  public email: string;

  @IsString({
    message: error_keys.users.Invalid_Phone,
  })
  @IsNotEmpty({
    message: error_keys.users.Invalid_Phone,
  })
  @IsPhoneNumber(VALIDATOR_SETTINGS.PHONE_COUNTRY_CODE, {
    message: error_keys.users.Invalid_Phone,
  })
  @MaxLength(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH, {
    message: error_keys.users.Phone_To_Long,
  })
  public phone: string;

  @IsString({
    message: error_keys.users.Invalid_Password,
  })
  @IsNotEmpty({
    message: error_keys.users.Invalid_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: error_keys.users.Password_To_Long,
  })
  @IsStrongPassword(VALIDATOR_SETTINGS.IS_STRONG_PASSWORD_OPTIONS, {
    message: error_keys.users.Invalid_Password,
  })
  public password: string;
}

export class CreateUserPayload extends BasePayload {
  userData: CreateUserDto;

  constructor(userData: CreateUserDto, currentUserId: number | undefined) {
    super();
    this.userData = userData;
    this.currentUserId = currentUserId;
  }
}
