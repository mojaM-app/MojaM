import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { VALIDATOR_SETTINGS } from '@utils';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserTryingToLogInDto {
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Email,
  })
  @IsString({
    message: errorKeys.users.Invalid_Email,
  })
  @MaxLength(VALIDATOR_SETTINGS.EMAIL_MAX_LENGTH, {
    message: errorKeys.users.Invalid_Email,
  })
  public email: string | null | undefined;

  public phone?: string;
}

export interface UserInfoBeforeLogInResultDto {
  isEmailSufficientToLogIn: boolean;
  isPasswordSet?: boolean;
}

export class GetUserInfoBeforeLogInResponseDto implements IResponse<UserInfoBeforeLogInResultDto> {
  public readonly data: UserInfoBeforeLogInResultDto;

  public constructor(userInfo: UserInfoBeforeLogInResultDto) {
    this.data = userInfo;
  }
}
