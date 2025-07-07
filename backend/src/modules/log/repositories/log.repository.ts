import { IGridPageResponseDto, IPageData, ISortData } from '@core';
import { BaseRepository } from '@db';
import { Service } from 'typedi';
import { And, FindManyOptions, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { vLog } from '../../../dataBase/entities/logs/vLog.entity';

export interface LogFilters {
  level: string | undefined;
  isSecurityEvent: boolean | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

@Service()
export class LogRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async get(paginator: IPageData, sort: ISortData, filters?: LogFilters): Promise<IGridPageResponseDto<vLog>> {
    const whereConditions: any = {};

    if (filters?.level) {
      whereConditions.level = filters.level;
    }

    if (filters?.isSecurityEvent !== undefined) {
      whereConditions.isSecurityEvent = filters.isSecurityEvent;
    }

    if (filters?.startDate || filters?.endDate) {
      const dateConditions: any[] = [];
      if (filters.startDate) {
        dateConditions.push(MoreThanOrEqual(filters.startDate));
      }
      if (filters.endDate) {
        dateConditions.push(LessThanOrEqual(filters.endDate));
      }

      if (dateConditions.length === 1) {
        whereConditions.createdAt = dateConditions[0];
      } else if (dateConditions.length === 2) {
        whereConditions.createdAt = And(...dateConditions);
      }
    }

    const findOptions: FindManyOptions<vLog> = {
      take: paginator.pageSize,
      skip: paginator.pageSize * paginator.pageIndex,
      order: {
        [sort.column]: sort.direction,
      },
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
    };

    const result = await this._dbContext.vLogs.findAndCount(findOptions);

    return {
      items: result[0],
      totalCount: result[1],
    };
  }
}
