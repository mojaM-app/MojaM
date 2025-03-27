import { events } from '@events';
import { errorKeys } from '@exceptions';
import { DtoTransformFunctions } from '@helpers/DtoTransformFunctions';
import { IResponse } from '@interfaces';
import { IsPasswordOrPinValid } from '@validators';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasscodeDto {
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
    message: errorKeys.login.Invalid_Reset_Passcode_Token,
  })
  @IsString({
    message: errorKeys.login.Invalid_Reset_Passcode_Token,
  })
  @Transform(DtoTransformFunctions.returnNullIfEmpty)
  public token: string;
}

export class ResetPasscodeReqDto {
  public readonly userGuid: string | undefined;
  public readonly model: ResetPasscodeDto | undefined;

  public constructor(userGuid: string | undefined, model: ResetPasscodeDto | undefined) {
    this.userGuid = userGuid;
    this.model = model;
  }
}

export interface IResetPasscodeResultDto {
  isPasscodeSet: boolean;
}

export class ResetPasscodeResponseDto implements IResponse<IResetPasscodeResultDto> {
  public readonly data: IResetPasscodeResultDto;
  public readonly message: string;

  public constructor(result: IResetPasscodeResultDto) {
    this.data = result;
    this.message = events.users.userPasscodeChanged;
  }
}
