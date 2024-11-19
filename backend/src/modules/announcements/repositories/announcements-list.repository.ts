import { IGridPageResponseDto, IPageData, ISortData } from '@interfaces';
import { BaseRepository } from '@modules/common';
import { Service } from 'typedi';
import { vAnnouncement } from '../entities/vAnnouncement.entity';

@Service()
export class AnnouncementsListRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async get(paginator: IPageData, sort: ISortData): Promise<IGridPageResponseDto<vAnnouncement>> {
    const result = await this._dbContext.vAnnouncements.findAndCount({
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
