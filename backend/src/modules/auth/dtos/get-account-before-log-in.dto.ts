import { VALIDATOR_SETTINGS } from '@config';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers/DtoTransformFunctions';
import { IResponse } from '@interfaces';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';
import { AuthenticationTypes } from '../enums/authentication-type.enum';

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
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public email: string | null | undefined;

  @IsOptional()
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
  public phone?: string;
}

export interface IGetAccountBeforeLogInResultDto {
  isPhoneRequired?: boolean;
  isActive?: boolean;
  authType?: AuthenticationTypes;
  shouldConfirmEmail?: boolean;
}

export class GetAccountBeforeLogInResponseDto implements IResponse<IGetAccountBeforeLogInResultDto> {
  public readonly data: IGetAccountBeforeLogInResultDto;

  public constructor(account: IGetAccountBeforeLogInResultDto) {
    this.data = account;
  }
}
