import { events } from '@events/events';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { CommunityService } from '@modules/community/services/community.service';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class RegulationsController {
  public communityService = Container.get(CommunityService);

  public get = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: string = await this.communityService.getRegulations();

      res.status(200).json({ data: data, message: events.community.regulations.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
