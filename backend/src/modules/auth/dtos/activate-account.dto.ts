import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { IsPasswordEmptyOrValid } from '@modules/users/dtos/create-user.dto';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActivateAccountDto {
  @IsOptional()
  @IsPasswordEmptyOrValid({
    message: errorKeys.users.Invalid_Password,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  public password?: string | null;

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_FirstName,
  })
  @MaxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH, {
    message: errorKeys.users.FirstName_Too_Long,
  })
  public firstName?: string | null;

  @IsOptional()
  @IsString({
    message: errorKeys.users.Invalid_LastName,
  })
  @MaxLength(VALIDATOR_SETTINGS.NAME_MAX_LENGTH, {
    message: errorKeys.users.LastName_Too_Long,
  })
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
