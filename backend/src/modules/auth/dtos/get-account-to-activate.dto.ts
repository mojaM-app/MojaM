import { IResponse } from '@interfaces';

export class GetAccountToActivateReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined) {
    this.userGuid = userGuid;
  }
}

export interface IAccountToActivateResultDto {
  isActive: boolean;
  isLockedOut?: boolean;
  email?: string;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  joiningDate?: Date | null;
}

export class GetAccountToActivateResponseDto implements IResponse<IAccountToActivateResultDto> {
  public readonly data: IAccountToActivateResultDto;

  public constructor(result: IAccountToActivateResultDto) {
    this.data = result;
  }
}
