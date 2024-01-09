import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import { CommunityService } from '@modules/community';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class DiaconieController extends BaseController {
  private _communityService: CommunityService | undefined = undefined;
  constructor() {
    super();
    this._communityService = Container.get(CommunityService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: string = await this._communityService.getDiaconie();

      res.status(200).json({ data: data, message: events.community.diaconie.retrieved });
    } catch (error) {
      next(error);
    }
  };
}
