import { BaseController, IPageData, IRequestWithIdentity, ISortData } from '@core';
import { toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { GetLogListReqDto, GetLogListResponseDto, LogsGridPageDto } from '../dtos/get-log-list.dto';
import { LogService } from '../services/log.service';

export class LogListController extends BaseController {
  private readonly _service: LogService;

  constructor() {
    super();
    this._service = Container.get(LogService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetLogListReqDto(
        this.getPageData(req),
        this.getSortData(req),
        req.query?.search?.toString(),
        this.getCurrentUserId(req),
        req.query?.level?.toString(),
        req.query?.isSecurityEvent ? req.query.isSecurityEvent === 'true' : undefined,
        req.query?.startDate ? new Date(req.query.startDate.toString()) : undefined,
        req.query?.endDate ? new Date(req.query.endDate.toString()) : undefined,
      );
      const result: LogsGridPageDto = await this._service.getList(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetLogListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getPageData(req: IRequestWithIdentity): IPageData {
    const maxPageSize = 1000;
    let pageSize = toNumber(req.query?.pageSize) ?? 10;
    if (pageSize > maxPageSize) {
      pageSize = maxPageSize;
    }
    if (pageSize < 1) {
      pageSize = 1;
    }

    let pageIndex = toNumber(req.query?.page) ?? 0;
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
      column: req.query?.column?.toString() ?? 'createdAt',
      direction: req.query?.direction?.toString() ?? 'desc',
    } satisfies ISortData;
  }
}
