import { IGridPageResponseDto, IPageData, ISortData } from '@interfaces';
import { BaseRepository } from '@modules/common';
import { Service } from 'typedi';
import { FindOptionsWhere } from 'typeorm';
import { User } from '../entities/user.entity';

@Service()
export class UserListRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async get(paginator: IPageData, sort: ISortData): Promise<IGridPageResponseDto<User>> {
    const where: FindOptionsWhere<User> = {
      isDeleted: false,
    };

    const result = await this._dbContext.users.findAndCount({
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
