import { VALIDATOR_SETTINGS } from '@config';
import { events } from '@events';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
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

  @IsNotEmpty({
    message: errorKeys.users.Invalid_User_Id,
  })
  @IsString({
    message: errorKeys.users.Invalid_User_Id,
  })
  @IsUUID('all', {
    message: errorKeys.users.Invalid_User_Id,
  })
  public userId: string | null | undefined;

  @IsNotEmpty({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  @IsString({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  public token: string | null | undefined;
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
