import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { GetNewsDto, GetNewsResponseDto, NewsService } from '@modules/news';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class NewsController extends BaseController {
  private readonly _newsService: NewsService;

  constructor() {
    super();
    this._newsService = Container.get(NewsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result: GetNewsDto = await this._newsService.get();
      res.status(200).json(new GetNewsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
