import { BaseReqDto, events, type IGridPageResponseDto, type IPageData, type IResponse, type ISortData } from '@core';

export interface ILogGridItemDto {
  id: number;
  level: string;
  message: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  requestId?: string;
  userId?: string;
  severity?: string;
  isSecurityEvent: boolean;
  createdAt: Date;
}

export type TLogsGridPageDto = IGridPageResponseDto<ILogGridItemDto>;

export class GetLogListReqDto extends BaseReqDto {
  public readonly page: IPageData;
  public readonly sort: ISortData;
  public readonly search?: string;
  public readonly level?: string;
  public readonly isSecurityEvent?: boolean;
  public readonly startDate?: Date;
  public readonly endDate?: Date;

  constructor(
    page: IPageData,
    sort: ISortData,
    search: string | undefined,
    currentUserId: number | undefined,
    level: string | undefined,
    isSecurityEvent: boolean | undefined,
    startDate: Date | undefined,
    endDate: Date | undefined,
  ) {
    super(currentUserId);
    this.page = page;
    this.sort = sort;
    this.search = search;
    this.level = level;
    this.isSecurityEvent = isSecurityEvent;
    this.startDate = startDate;
    this.endDate = endDate;
  }
}

export class GetLogListResponseDto implements IResponse<TLogsGridPageDto> {
  public readonly data: TLogsGridPageDto;
  public readonly message: string;

  constructor(data: TLogsGridPageDto) {
    this.data = data;
    this.message = events.log.logListRetrieved;
  }
}
