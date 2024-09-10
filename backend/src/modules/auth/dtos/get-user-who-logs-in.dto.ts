import { IResponse } from '@interfaces';
import { UserWhoLogsInResult } from '../interfaces/user-who-logs-in.interfaces';

export class GetUserWhoLogsInResponseDto implements IResponse<UserWhoLogsInResult> {
  public readonly data: UserWhoLogsInResult;

  public constructor(data: UserWhoLogsInResult) {
    this.data = data;
  }
}
