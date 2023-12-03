import { error_keys } from '@exceptions/error.keys';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword, IsStrongPasswordOptions, MaxLength } from 'class-validator';

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
  @MaxLength(320, {
    message: error_keys.users.create.Email_To_Long,
  })
  public email: string;

  @IsString({
    message: error_keys.users.create.Invalid_Phone,
  })
  @IsNotEmpty({
    message: error_keys.users.create.Invalid_Phone,
  })
  @IsPhoneNumber('PL', {
    message: error_keys.users.create.Invalid_Phone,
  })
  @MaxLength(30, {
    message: error_keys.users.create.Phone_To_Long,
  })
  public phone: string;

  @IsString({
    message: error_keys.users.create.Invalid_Password,
  })
  @IsNotEmpty({
    message: error_keys.users.create.Invalid_Password,
  })
  @MaxLength(50, {
    message: error_keys.users.create.Password_To_Long,
  })
  @IsStrongPassword(<IsStrongPasswordOptions>{ minLength: 9, minLowercase: 1, minUppercase: 1, minNumbers: 0, minSymbols: 0 }, {
    message: error_keys.users.create.Invalid_Password,
  })
  public password: string;
}
