import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { BaseReqDto } from '@modules/common';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
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
}

export class UpdateUserProfileReqDto extends BaseReqDto {
  public readonly userData: UpdateUserProfileDto;

  public constructor(currentUserId: number | undefined, userData: UpdateUserProfileDto) {
    super(currentUserId);
    this.userData = userData;
  }
}

export class UpdateUserProfileResponseDto implements IResponse<boolean> {
  public readonly data: boolean;
  public readonly message: string;

  public constructor(data: boolean) {
    this.data = data;
    this.message = events.users.userProfileUpdated;
  }
}
