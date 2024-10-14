import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { VALIDATOR_SETTINGS } from '@utils';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Password,
  })
  @IsString({
    message: errorKeys.users.Invalid_Password,
  })
  @MaxLength(VALIDATOR_SETTINGS.PASSWORD_MAX_LENGTH, {
    message: errorKeys.users.Invalid_Password,
  })
  public password: string | null | undefined;

  @IsNotEmpty()
  @IsString()
  @IsUUID('all')
  public userId: string | null | undefined;

  @IsNotEmpty()
  @IsString()
  public token: string | null | undefined;
}

export interface ResetPasswordResultDto {
  isPasswordSet: boolean;
}

export class ResetPasswordResponseDto implements IResponse<ResetPasswordResultDto> {
  public readonly data: ResetPasswordResultDto;

  public constructor(userInfo: ResetPasswordResultDto) {
    this.data = userInfo;
  }
}
