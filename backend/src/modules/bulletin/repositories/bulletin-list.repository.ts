import { IGridPageResponseDto, IPageData, ISortData } from '@core';
import { BaseRepository } from '@db';
import { Service } from 'typedi';
import { vBulletin } from '../../../dataBase/entities/bulletin/vBulletin.entity';

@Service()
export class BulletinListRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async get(paginator: IPageData, sort: ISortData): Promise<IGridPageResponseDto<vBulletin>> {
    const result = await this._dbContext.vBulletins.findAndCount({
      take: paginator.pageSize,
      skip: paginator.pageSize * paginator.pageIndex,
      order: {
        [sort.column]: sort.direction,
      },
    });

    return {
      items: result[0],
      totalCount: result[1],
    };
  }
}
