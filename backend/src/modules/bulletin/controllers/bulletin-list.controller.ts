import { BaseController, type IPageData, type IRequestWithIdentity, type ISortData } from '@core';
import { toNumber } from '@utils';
import type { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { BulletinListViewColumns } from '../../../dataBase/entities/bulletin/vBulletin.entity';
import {
  type BulletinsGridPageDto,
  GetBulletinListReqDto,
  GetBulletinListResponseDto,
} from '../dtos/get-bulletin-list.dto';
import { BulletinListService } from '../services/bulletin-list.service';

export class BulletinListController extends BaseController {
  private readonly _service: BulletinListService;

  constructor() {
    super();
    this._service = Container.get(BulletinListService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetBulletinListReqDto(
        this.getPageData(req),
        this.getSortData(req),
        this.getCurrentUserId(req),
      );
      const result: BulletinsGridPageDto = await this._service.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetBulletinListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getPageData(req: IRequestWithIdentity): IPageData {
    const maxPageSize = 100;
    let pageSize = toNumber(req.query?.pageSize) ?? 10;
    if (pageSize > maxPageSize) {
      pageSize = maxPageSize;
    }
    if (pageSize < 1) {
      pageSize = 1;
    }

    let pageIndex = toNumber(req.query?.pageIndex) ?? 0;
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
      column: req.query.column?.toString() ?? BulletinListViewColumns.date,
      direction: req.query.direction?.toString() ?? 'desc',
    } satisfies ISortData;
  }
}
