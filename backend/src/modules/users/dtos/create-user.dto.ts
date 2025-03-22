import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers/DtoTransformFunctions';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IsNotSetIf, IsPasswordEmptyOrValid, IsPinEmptyOrValid } from '@validators';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';
import { IUserDto } from '../interfaces/IUser.dto';

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
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
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
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public phone: string;

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

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_Password,
  })
  @IsPasswordEmptyOrValid({
    message: errorKeys.users.Invalid_Password,
  })
  @IsNotSetIf('pin', {
    message: errorKeys.users.Both_Password_And_Pin_Are_Set,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public password?: string | null;

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_Pin,
  })
  @IsPinEmptyOrValid({
    message: errorKeys.users.Invalid_Pin,
  })
  @IsNotSetIf('password', {
    message: errorKeys.users.Both_Password_And_Pin_Are_Set,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public pin?: string | null;
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
