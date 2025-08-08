import { type NextFunction, type Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { BaseController, type IPageData, type IRequestWithIdentity, type ISortData } from '@core';
import { toNumber } from '@utils';
import { UserListViewColumns } from '../../../dataBase/entities/users/vUser.entity';
import { GetUserListReqDto, GetUserListResponseDto, type TUsersGridPageDto } from '../dtos/get-user-list.dto';
import { UserListService } from '../services/user-list.service';

export class UserListController extends BaseController {
  private readonly _service: UserListService;

  constructor() {
    super();
    this._service = Container.get(UserListService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserListReqDto(this.getPageData(req), this.getSortData(req), this.getCurrentUserId(req));
      const result: TUsersGridPageDto = await this._service.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetUserListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getPageData(req: IRequestWithIdentity): IPageData {
    const defaultPageSize = 10;
    const maxPageSize = 100;
    let pageSize = toNumber(req.query.pageSize) ?? defaultPageSize;
    if (pageSize > maxPageSize) {
      pageSize = maxPageSize;
    }
    if (pageSize < 1) {
      pageSize = 1;
    }

    let pageIndex = toNumber(req.query.pageIndex) ?? 0;
    if (pageIndex < 0) {
      pageIndex = 0;
    }

    return {
      pageIndex,
      pageSize,
    } satisfies IPageData;
  }

  private getSortData(req: IRequestWithIdentity): ISortData {
    return {
      column: req.query.column?.toString() ?? UserListViewColumns.firstName,
      direction: req.query.direction?.toString() ?? 'asc',
    } satisfies ISortData;
  }
}
