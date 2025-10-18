import { events, type IResponse } from '@core';
import { ISystemInfo } from '@modules/system-info/services/health.service';

export class GetSystemInfoResponseDto implements IResponse<ISystemInfo> {
  public readonly data: ISystemInfo;
  public readonly message: string;

  constructor(data: ISystemInfo) {
    this.data = data;
    this.message = events.systemInfo.systemInfoRetrieved;
  }
}
