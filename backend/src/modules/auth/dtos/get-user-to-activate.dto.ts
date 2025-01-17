import { IResponse } from '@interfaces';

export class GetUserToActivateReqDto {
  public readonly userGuid: string | undefined;

  public constructor(userGuid: string | undefined) {
    this.userGuid = userGuid;
  }
}

export interface IUserToActivateResultDto {
  isActive: boolean;
  isLockedOut?: boolean;
  email?: string;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  joiningDate?: Date | null;
}

export class GetUserToActivateResponseDto implements IResponse<IUserToActivateResultDto> {
  public readonly data: IUserToActivateResultDto;

  public constructor(result: IUserToActivateResultDto) {
    this.data = result;
  }
}
