import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { GetCommunityResponseDto, IGetCommunityDto } from '../dtos/community.dto';
import { CommunityService } from '../services/community.service';

export class CommunityController extends BaseController {
  private readonly _communityService: CommunityService;
  constructor() {
    super();
    this._communityService = Container.get(CommunityService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result: IGetCommunityDto = await this._communityService.get();
      res.status(200).json(new GetCommunityResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
