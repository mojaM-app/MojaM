import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { CommunityService } from '@modules/news/services/community.service';
import { events } from '@events/events';

export class DiaconieController {
  public communityService = Container.get(CommunityService);

  public get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: string = await this.communityService.getDiaconie();

      res.status(200).json({ data: data, message: events.community.diaconie.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
