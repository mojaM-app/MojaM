import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { InformationService } from '@modules/news/services/information.service';
import { events } from '@events/events';
import { GetInformationDto } from '@modules/news/dtos/information.dto';

export class InformationController {
  public informationService = Container.get(InformationService);

  public get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetInformationDto = await this.informationService.get();

      res.status(200).json({ data: data, message: events.news.information.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
