import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import { GetInformationDto, InformationService } from '@modules/news';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class InformationController extends BaseController {
  private readonly _informationService: InformationService | undefined = undefined;

  public constructor() {
    super();
    this._informationService = Container.get(InformationService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetInformationDto = await this._informationService.get();

      res.status(200).json({ data: data, message: events.news.information.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
