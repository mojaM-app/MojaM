import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { CommunityService } from '@modules/news/services/community.service';
import { events } from '@events/events';

export class RegulationsController {
  public communityService = Container.get(CommunityService);

  public get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: string = await this.communityService.getRegulations();

      res.status(200).json({ data: data, message: events.community.regulations.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
