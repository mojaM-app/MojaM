import { BaseController, IPageData, IRequestWithIdentity, ISortData } from '@core';
import { toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { AnnouncementListViewColumns } from '../../../dataBase/entities/announcements/vAnnouncement.entity';
import {
  AnnouncementsGridPageDto,
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
    return {
      pageIndex: toNumber(req.query?.pageIndex) ?? 0,
      pageSize: toNumber(req.query?.pageSize) ?? 10,
    } satisfies IPageData;
  }

  private getSortData(req: IRequestWithIdentity): ISortData {
    return {
      column: req.query?.column?.toString() ?? AnnouncementListViewColumns.validFromDate,
      direction: req.query?.direction?.toString() ?? 'asc',
    } satisfies ISortData;
  }
}
