import { VALIDATOR_SETTINGS } from '@config';
import { errorKeys } from '@exceptions';
import { IResponse } from '@interfaces';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AccountTryingToLogInDto {
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

export interface IGetAccountBeforeLogInResultDto {
  isPhoneRequired?: boolean;
  isActive?: boolean;
  isPasswordSet?: boolean;
  shouldConfirmEmail?: boolean;
}

export class GetAccountBeforeLogInResponseDto implements IResponse<IGetAccountBeforeLogInResultDto> {
  public readonly data: IGetAccountBeforeLogInResultDto;

  public constructor(account: IGetAccountBeforeLogInResultDto) {
    this.data = account;
  }
}
