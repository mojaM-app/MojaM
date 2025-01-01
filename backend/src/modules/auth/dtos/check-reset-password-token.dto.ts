import { IResponse } from '@interfaces';

export class CheckResetPasswordTokenReqDto {
  public readonly userGuid: string | undefined;
  public readonly resetPasswordToken: string | undefined;

  public constructor(userGuid: string | undefined, resetPasswordToken: string | undefined) {
    this.userGuid = userGuid;
    this.resetPasswordToken = resetPasswordToken;
  }
}

export interface CheckResetPasswordTokenResultDto {
  isValid: boolean;
  userEmail?: string;
}

export class CheckResetPasswordTokenResponseDto implements IResponse<CheckResetPasswordTokenResultDto> {
  public readonly data: CheckResetPasswordTokenResultDto;

  public constructor(result: CheckResetPasswordTokenResultDto) {
    this.data = result;
  }
}
