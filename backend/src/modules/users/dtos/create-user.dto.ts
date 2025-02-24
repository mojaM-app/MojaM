import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { isNullOrEmptyString } from '@utils';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  isStrongPassword,
  maxLength,
  MaxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { IUserDto } from '../interfaces/IUser.dto';

export function IsPasswordEmptyOrValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPasswordEmptyOrValid',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (isNullOrEmptyString(value)) {
            return true;
          }

          return maxLength(value, VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH) && isStrongPassword(value, VALIDATOR_SETTINGS.STRONG_PASSWORD_OPTIONS);
        },
      },
    });
  };
}

export class CreateUserDto {
  @IsString({
    message: errorKeys.users.Invalid_Email,
  })
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Email,
  })
  @IsEmail(
    {},
    {
      message: errorKeys.users.Invalid_Email,
    },
  )
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: errorKeys.users.Email_Too_Long,
  })
  public email: string;

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
  public phone: string;

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_FirstName,
  })
  @MaxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH, {
    message: errorKeys.users.FirstName_Too_Long,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  public firstName?: string | null;

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_LastName,
  })
  @MaxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH, {
    message: errorKeys.users.LastName_Too_Long,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  public lastName?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public joiningDate?: Date | null;

  @IsOptional()
  @IsPasswordEmptyOrValid({
    message: errorKeys.users.Invalid_Password,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  public password?: string;
}

export class CreateUserReqDto extends BaseReqDto {
  public readonly userData: CreateUserDto;

  public constructor(userData: CreateUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.userData = userData;
  }
}

export class CreateUserResponseDto implements IResponse<IUserDto> {
  public readonly data: IUserDto;
  public readonly message: string;

  public constructor(data: IUserDto) {
    this.data = data;
    this.message = events.users.userCreated;
  }
}
