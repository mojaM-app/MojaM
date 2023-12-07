import { events } from '@events/events';
import { CommunityService } from '@modules/community/services/community.service';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class StructureController {
  public communityService = Container.get(CommunityService);

  public get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: string = await this.communityService.getStructure();

      res.status(200).json({ data: data, message: events.community.structure.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
