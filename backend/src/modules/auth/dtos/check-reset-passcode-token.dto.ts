import { AuthenticationTypes, IResponse } from '@core';

export class CheckResetPasscodeTokenReqDto {
  public readonly userGuid: string | undefined;
  public readonly token: string | undefined;

  constructor(userGuid: string | undefined, token: string | undefined) {
    this.userGuid = userGuid;
    this.token = token;
  }
}

export interface ICheckResetPasscodeTokenResultDto {
  isValid: boolean;
  userEmail?: string;
  authType?: AuthenticationTypes;
}

export class CheckResetPasscodeTokenResponseDto implements IResponse<ICheckResetPasscodeTokenResultDto> {
  public readonly data: ICheckResetPasscodeTokenResultDto;

  constructor(result: ICheckResetPasscodeTokenResultDto) {
    this.data = result;
  }
}
