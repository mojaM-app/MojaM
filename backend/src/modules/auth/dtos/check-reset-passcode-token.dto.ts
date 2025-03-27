import { IResponse } from '@interfaces';

export class CheckResetPasscodeTokenReqDto {
  public readonly userGuid: string | undefined;
  public readonly token: string | undefined;

  public constructor(userGuid: string | undefined, token: string | undefined) {
    this.userGuid = userGuid;
    this.token = token;
  }
}

export interface CheckResetPasscodeTokenResultDto {
  isValid: boolean;
  userEmail?: string;
}

export class CheckResetPasscodeTokenResponseDto implements IResponse<CheckResetPasscodeTokenResultDto> {
  public readonly data: CheckResetPasscodeTokenResultDto;

  public constructor(result: CheckResetPasscodeTokenResultDto) {
    this.data = result;
  }
}
