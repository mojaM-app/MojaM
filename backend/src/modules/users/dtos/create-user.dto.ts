import { error_keys } from '@exceptions/error.keys';
import { VALIDATOR_SETTINGS } from '@utils/constants';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: error_keys.users.create.Invalid_Email,
  })
  @IsNotEmpty({
    message: error_keys.users.create.Invalid_Email,
  })
  @IsEmail(
    {},
    {
      message: error_keys.users.create.Invalid_Email,
    },
  )
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: error_keys.users.create.Email_To_Long,
  })
  public email: string;

  @IsString({
    message: error_keys.users.create.Invalid_Phone,
  })
  @IsNotEmpty({
    message: error_keys.users.create.Invalid_Phone,
  })
  @IsPhoneNumber(VALIDATOR_SETTINGS.PHONE_COUNTRY_CODE, {
    message: error_keys.users.create.Invalid_Phone,
  })
  @MaxLength(VALIDATOR_SETTINGS.PHONE_MAX_LENGTH, {
    message: error_keys.users.create.Phone_To_Long,
  })
  public phone: string;

  @IsString({
    message: error_keys.users.create.Invalid_Password,
  })
  @IsNotEmpty({
    message: error_keys.users.create.Invalid_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: error_keys.users.create.Password_To_Long,
  })
  @IsStrongPassword(VALIDATOR_SETTINGS.IS_STRONG_PASSWORD_OPTIONS, {
    message: error_keys.users.create.Invalid_Password,
  })
  public password: string;
}
