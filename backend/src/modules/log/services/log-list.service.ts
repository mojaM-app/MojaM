import { Service } from 'typedi';
import { BaseService } from '@core';
import { vLog } from '../../../dataBase/entities/logs/vLog.entity';
import { GetLogListReqDto, ILogGridItemDto, TLogsGridPageDto } from '../dtos/get-log-list.dto';
import { ILogFilters, LogListRepository } from '../repositories/log-list.repository';

@Service()
export class LogListService extends BaseService {
  constructor(private readonly _repository: LogListRepository) {
    super();
  }

  public async get(reqDto: GetLogListReqDto): Promise<TLogsGridPageDto> {
    const filters: ILogFilters = {
      level: reqDto.level,
      isSecurityEvent: reqDto.isSecurityEvent,
      startDate: reqDto.startDate,
      endDate: reqDto.endDate,
    };

    const recordsWithTotal = await this._repository.get(reqDto.page, reqDto.sort, filters);

    const mappedData: ILogGridItemDto[] = recordsWithTotal.items.map((log: vLog) => this.vLogToILogGridItemDto(log));

    return {
      items: mappedData,
      totalCount: recordsWithTotal.totalCount,
    } satisfies TLogsGridPageDto;
  }

  private vLogToILogGridItemDto(log: vLog): ILogGridItemDto {
    return {
      id: log.id,
      level: log.level,
      message: log.message,
      source: log.source,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      path: log.path,
      method: log.method,
      requestId: log.requestId,
      userId: log.userId,
      severity: log.severity,
      isSecurityEvent: log.isSecurityEvent,
      createdAt: log.createdAt,
    } satisfies ILogGridItemDto;
  }
}
