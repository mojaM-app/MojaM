import { IPageData, IRequestWithIdentity, ISortData } from '@interfaces';
import {
  AnnouncementsGridPageDto,
  AnnouncementsListService,
  GetAnnouncementListReqDto,
  GetAnnouncementListResponseDto,
} from '@modules/announcements';
import { BaseController } from '@modules/common';
import { toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { AnnouncementListViewColumns } from '../entities/vAnnouncement.entity';

export class AnnouncementsListController extends BaseController {
  private readonly _service: AnnouncementsListService;

  public constructor() {
    super();
    this._service = Container.get(AnnouncementsListService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetAnnouncementListReqDto(this.getPageData(req), this.getSortData(req), this.getCurrentUserId(req));
      const result: AnnouncementsGridPageDto = await this._service.get(reqDto);
      res.status(200).json(new GetAnnouncementListResponseDto(result));
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
      column: req?.query?.column?.toString() ?? AnnouncementListViewColumns.validFromDate!,
      direction: req?.query?.direction?.toString() ?? 'asc',
    } satisfies ISortData;
  }
}
