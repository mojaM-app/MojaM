import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { CommunityService, GetMissionResponseDto } from '@modules/community';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class MissionController extends BaseController {
  private readonly _communityService: CommunityService;
  constructor() {
    super();
    this._communityService = Container.get(CommunityService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result: string = await this._communityService.getMission();
      res.status(200).json(new GetMissionResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
