import { events } from '@events';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers/DtoTransformFunctions';
import { IResponse } from '@interfaces';
import { IsPasswordEmptyOrValid } from '@validators';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Password,
  })
  @IsString({
    message: errorKeys.users.Invalid_Password,
  })
  @IsPasswordEmptyOrValid({
    message: errorKeys.users.Invalid_Password,
  })
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
  public password: string | null | undefined;

  @IsNotEmpty({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  @IsString({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  @Transform(DtoTransformFunctions.trimAndReturnNullIfEmpty)
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

export interface IResetPasswordResultDto {
  isPasswordSet: boolean;
}

export class ResetPasswordResponseDto implements IResponse<IResetPasswordResultDto> {
  public readonly data: IResetPasswordResultDto;
  public readonly message: string;

  public constructor(result: IResetPasswordResultDto) {
    this.data = result;
    this.message = events.users.userPasswordChanged;
  }
}
