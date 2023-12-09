import { events } from '@events/events';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { GetInformationDto } from '@modules/news/dtos/information.dto';
import { InformationService } from '@modules/news/services/information.service';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class InformationController {
  public informationService = Container.get(InformationService);

  public get = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetInformationDto = await this.informationService.get();

      res.status(200).json({ data: data, message: events.news.information.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
