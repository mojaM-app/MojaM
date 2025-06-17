import { VALIDATOR_SETTINGS } from '@config';
import { BaseReqDto, IResponse, events } from '@core';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers';
import { IsPasswordOrPinValid } from '@validators';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActivateAccountDto {
  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_Passcode,
  })
  @IsPasswordOrPinValid({
    message: errorKeys.users.Invalid_Passcode,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public passcode?: string | null;

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

  constructor(userGuid: string | undefined, model: ActivateAccountDto | undefined) {
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

  constructor(data: IActivateAccountResultDto) {
    this.data = data;
    this.message = events.users.userActivated;
  }
}
