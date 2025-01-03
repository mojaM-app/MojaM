import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { isNullOrEmptyString, VALIDATOR_SETTINGS } from '@utils';
import {
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
  @IsPasswordEmptyOrValid({
    message: errorKeys.users.Invalid_Password,
  })
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
  public readonly message?: string | undefined;

  public constructor(data: IUserDto) {
    this.data = data;
    this.message = events.users.userCreated;
  }
}
