import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers/DtoTransformFunctions';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IsNotSetIf, IsPasswordEmptyOrValid, IsPinEmptyOrValid } from '@validators';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActivateAccountDto {
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
  @IsDate({
    message: errorKeys.users.Invalid_JoiningDate,
  })
  public joiningDate?: Date | null;
}

export class ActivateAccountReqDto extends BaseReqDto {
  public readonly userGuid: string | undefined;
  public readonly model: ActivateAccountDto | undefined;

  public constructor(userGuid: string | undefined, model: ActivateAccountDto | undefined) {
    super(undefined);
    this.userGuid = userGuid;
    this.model = model;
  }
}

export interface IActivateAccountResultDto {
  isActive: boolean;
}

export class ActivateAccountResponseDto implements IResponse<IActivateAccountResultDto> {
  public readonly data: IActivateAccountResultDto;
  public readonly message: string;

  public constructor(data: IActivateAccountResultDto) {
    this.data = data;
    this.message = events.users.userActivated;
  }
}
