import { VALIDATOR_SETTINGS } from '@config';
import { BaseReqDto, DtoTransformFunctions, events, type IResponse, type IUserDto } from '@core';
import { errorKeys } from '@exceptions';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
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
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public email?: string;

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

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_FirstName,
  })
  @MaxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH, {
    message: errorKeys.users.FirstName_Too_Long,
  })
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public firstName?: string | null;

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_LastName,
  })
  @MaxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH, {
    message: errorKeys.users.LastName_Too_Long,
  })
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public lastName?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  public joiningDate?: Date | null;
}

export class UpdateUserReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;
  public readonly userData: UpdateUserDto;

  constructor(userGuid: string | undefined, userData: UpdateUserDto, currentUserId: number | undefined) {
    super(currentUserId);
    this.userGuid = userGuid;
    this.userData = userData;
  }
}

export class UpdateUserResponseDto implements IResponse<IUserDto> {
  public readonly data: IUserDto;
  public readonly message: string;

  constructor(data: IUserDto) {
    this.data = data;
    this.message = events.users.userUpdated;
  }
}
