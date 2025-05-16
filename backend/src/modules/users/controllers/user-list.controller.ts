import { IPageData, IRequestWithIdentity, ISortData } from '@interfaces';
import { BaseController } from '@modules/common';
import { GetUserListReqDto, GetUserListResponseDto, UserListService, UsersGridPageDto } from '@modules/users';
import { toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { UserListViewColumns } from './../../../dataBase/entities/users/vUser.entity';

export class UserListController extends BaseController {
  private readonly _service: UserListService;

  constructor() {
    super();
    this._service = Container.get(UserListService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserListReqDto(this.getPageData(req), this.getSortData(req), this.getCurrentUserId(req));
      const result: UsersGridPageDto = await this._service.get(reqDto);
      res.status(200).json(new GetUserListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getPageData(req: IRequestWithIdentity): IPageData {
    return {
      pageIndex: toNumber(req?.query?.pageIndex) ?? 0,
      pageSize: toNumber(req?.query?.pageSize) ?? 10,
    } satisfies IPageData;
  }

  private getSortData(req: IRequestWithIdentity): ISortData {
    return {
      column: req?.query?.column?.toString() ?? UserListViewColumns.firstName,
      direction: req?.query?.direction?.toString() ?? 'asc',
    } satisfies ISortData;
  }
}
