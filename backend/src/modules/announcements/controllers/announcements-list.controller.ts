import type { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { BaseController, type IPageData, type IRequestWithIdentity, type ISortData } from '@core';
import { toNumber } from '@utils';
import { AnnouncementListViewColumns } from '../../../dataBase/entities/announcements/vAnnouncement.entity';
import {
  type AnnouncementsGridPageDto,
  GetAnnouncementListReqDto,
  GetAnnouncementListResponseDto,
} from '../dtos/get-announcement-list.dto';
import { AnnouncementsListService } from '../services/announcements-list.service';

export class AnnouncementsListController extends BaseController {
  private readonly _service: AnnouncementsListService;

  constructor() {
    super();
    this._service = Container.get(AnnouncementsListService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetAnnouncementListReqDto(
        this.getPageData(req),
        this.getSortData(req),
        this.getCurrentUserId(req),
      );
      const result: AnnouncementsGridPageDto = await this._service.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetAnnouncementListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getPageData(req: IRequestWithIdentity): IPageData {
    const defaultPageSize = 10;
    const defaultPageIndex = 0;
    return {
      pageIndex: toNumber(req.query.pageIndex) ?? defaultPageIndex,
      pageSize: toNumber(req.query.pageSize) ?? defaultPageSize,
    } satisfies IPageData;
  }

  private getSortData(req: IRequestWithIdentity): ISortData {
    return {
      column: req.query.column?.toString() ?? AnnouncementListViewColumns.validFromDate,
      direction: req.query.direction?.toString() ?? 'asc',
    } satisfies ISortData;
  }
}
