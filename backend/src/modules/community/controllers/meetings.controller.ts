import { RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { CommunityService, GetMeetingsResponseDto } from '@modules/community';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class MeetingsController extends BaseController {
  private readonly _communityService: CommunityService;
  constructor() {
    super();
    this._communityService = Container.get(CommunityService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result: string = await this._communityService.getMeetings();
      res.status(200).json(new GetMeetingsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
