import { BaseService } from '@core';
import { Container, Service } from 'typedi';
import { vLog } from '../../../dataBase/entities/logs/vLog.entity';
import { GetLogListReqDto, ILogGridItemDto, LogsGridPageDto } from '../dtos/get-log-list.dto';
import { LogFilters, LogRepository } from '../repositories/log.repository';

@Service()
export class LogService extends BaseService {
  private readonly _repository: LogRepository = Container.get(LogRepository);

  public async getList(reqDto: GetLogListReqDto): Promise<LogsGridPageDto> {
    const filters: LogFilters = {
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
    } satisfies LogsGridPageDto;
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
