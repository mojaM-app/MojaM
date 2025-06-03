import { IGridPageResponseDto, IPageData, ISortData } from '@core';
import { BaseRepository } from '@db';
import { getAdminLoginData } from '@utils';
import { Service } from 'typedi';
import { FindOptionsWhere, Not } from 'typeorm';
import { vUser } from './../../../dataBase/entities/users/vUser.entity';

@Service()
export class UserListRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async get(paginator: IPageData, sort: ISortData): Promise<IGridPageResponseDto<vUser>> {
    const where: FindOptionsWhere<vUser> = {
      id: Not(getAdminLoginData().uuid),
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
