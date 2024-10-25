import { IPageData, ISortData, RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { GetUserListReqDto, GetUserListResponseDto, UserListService, UsersGridPageDto } from '@modules/users';
import { toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class UserListController extends BaseController {
  private readonly _userListService: UserListService;

  public constructor() {
    super();
    this._userListService = Container.get(UserListService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserListReqDto(this.getPageData(req), this.getSortData(req), this.getCurrentUserId(req));
      const result: UsersGridPageDto = await this._userListService.get(reqDto);
      res.status(200).json(new GetUserListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getPageData(req: RequestWithIdentity): IPageData {
    return {
      pageIndex: toNumber(req?.query?.pageIndex) ?? 0,
      pageSize: toNumber(req?.query?.pageSize) ?? 10,
    } satisfies IPageData;
  }

  private getSortData(req: RequestWithIdentity): ISortData {
    return {
      column: req?.query?.column?.toString() ?? 'firstName',
      direction: req?.query?.direction?.toString() ?? 'asc',
    } satisfies ISortData;
  }
}
