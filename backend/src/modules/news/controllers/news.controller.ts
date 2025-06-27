import { BaseController, IRequestWithIdentity } from '@core';
import { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { GetNewsResponseDto, type IGetNewsDto } from '../dtos/news.dto';
import { NewsService } from '../services/news.service';

export class NewsController extends BaseController {
  private readonly _newsService: NewsService;

  constructor() {
    super();
    this._newsService = Container.get(NewsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result: IGetNewsDto = await this._newsService.get(this.getCurrentUserId(req));
      res.status(StatusCode.SuccessOK).json(new GetNewsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
