import { events } from '@events';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers/DtoTransformFunctions';
import { IResponse } from '@interfaces';
import { IsPasswordOrPinValid } from '@validators';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({
    message: errorKeys.users.Invalid_Passcode,
  })
  @IsString({
    message: errorKeys.users.Invalid_Passcode,
  })
  @IsPasswordOrPinValid({
    message: errorKeys.users.Invalid_Passcode,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public passcode: string;

  @IsNotEmpty({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  @IsString({
    message: errorKeys.login.Invalid_Reset_Password_Token,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public token: string;
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
