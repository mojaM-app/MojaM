import { BaseController, type IRequestWithIdentity } from '@core';
import type { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { GetBulletinListReqDto, GetBulletinListResponseDto } from '../dtos/get-bulletin-list.dto';
import { BulletinState } from '../enums/bulletin-state.enum';
import { BulletinListService } from '../services/bulletin-list.service';

export class BulletinListController extends BaseController {
  private readonly _bulletinListService: BulletinListService;

  constructor() {
    super();
    this._bulletinListService = Container.get(BulletinListService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = req.query.state ? (parseInt(req.query.state as string) as BulletinState) : undefined;
      const reqDto = new GetBulletinListReqDto(state, this.getCurrentUserId(req)!);
      const result = await this._bulletinListService.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetBulletinListResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
