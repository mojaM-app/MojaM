import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

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

  @IsNotEmpty({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  @IsString({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  public token: string | null | undefined;
}

export class ResetPasswordReqDto {
  public readonly userGuid: string | undefined;
  public readonly model: ResetPasswordDto | undefined;

  public constructor(userGuid: string | undefined, model: ResetPasswordDto | undefined) {
    this.userGuid = userGuid;
    this.model = model;
  }
}

export interface ResetPasswordResultDto {
  isPasswordSet: boolean;
}

export class ResetPasswordResponseDto implements IResponse<ResetPasswordResultDto> {
  public readonly data: ResetPasswordResultDto;
  public readonly message: string;

  public constructor(userInfo: ResetPasswordResultDto) {
    this.data = userInfo;
    this.message = events.users.userPasswordChanged;
  }
}
