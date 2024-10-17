import { IGridPageResponseDto, IPageData, ISortData } from '@interfaces';
import { BaseRepository } from '@modules/common';
import { Service } from 'typedi';
import { FindOptionsWhere } from 'typeorm';
import { vUser } from '../entities/vUser.entity';

@Service()
export class UserListRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async get(paginator: IPageData, sort: ISortData): Promise<IGridPageResponseDto<vUser>> {
    const where: FindOptionsWhere<vUser> = {
      isDeleted: false,
    };

    const result = await this._dbContext.vUsers.findAndCount({
      where,
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
