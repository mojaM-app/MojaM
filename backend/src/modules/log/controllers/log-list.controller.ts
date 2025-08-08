import type { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { BaseController, type IPageData, type IRequestWithIdentity, type ISortData } from '@core';
import { toNumber } from '@utils';
import { GetLogListReqDto, GetLogListResponseDto, type TLogsGridPageDto } from '../dtos/get-log-list.dto';
import { LogListService } from '../services/log-list.service';

export class LogListController extends BaseController {
  private readonly _service: LogListService;

  constructor() {
    super();
    this._service = Container.get(LogListService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetLogListReqDto(
        this.getPageData(req),
        this.getSortData(req),
        req.query.search?.toString(),
        this.getCurrentUserId(req),
        req.query.level?.toString(),
        this.getIsSecurityEvent(req),
        this.getStartDate(req),
        this.getEndDate(req),
      );
      const result: TLogsGridPageDto = await this._service.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetLogListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getEndDate(req: IRequestWithIdentity): Date | undefined {
    const endDate = req.query.endDate?.toString();

    if (endDate === undefined || endDate === '') {
      return undefined;
    }

    return new Date(endDate);
  }

  private getStartDate(req: IRequestWithIdentity): Date | undefined {
    const startDate = req.query.startDate?.toString();

    if (startDate === undefined || startDate === '') {
      return undefined;
    }

    return new Date(startDate);
  }

  private getIsSecurityEvent(req: IRequestWithIdentity): boolean | undefined {
    const { isSecurityEvent } = req.query;

    if (isSecurityEvent === 'true') {
      return true;
    }

    if (isSecurityEvent === 'false') {
      return false;
    }

    return undefined;
  }

  private getPageData(req: IRequestWithIdentity): IPageData {
    const maxPageSize = 1000;
    const defaultPageSize = 10;
    let pageSize = toNumber(req.query.pageSize) ?? defaultPageSize;
    if (pageSize > maxPageSize) {
      pageSize = maxPageSize;
    }
    if (pageSize < 1) {
      pageSize = 1;
    }

    let pageIndex = toNumber(req.query.page) ?? 0;
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
      column: req.query.column?.toString() ?? 'createdAt',
      direction: req.query.direction?.toString() ?? 'desc',
    } satisfies ISortData;
  }
}
