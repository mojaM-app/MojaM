import { RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { GetNewsDto, GetNewsResponseDto, NewsService } from '@modules/news';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class NewsController extends BaseController {
  private readonly _newsService: NewsService;

  public constructor() {
    super();
    this._newsService = Container.get(NewsService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetNewsDto = await this._newsService.get();
      res.status(200).json(new GetNewsResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}
