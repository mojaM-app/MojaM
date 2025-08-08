import { type NextFunction, type Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { BaseController, type IRequestWithIdentity } from '@core';
import { GetCommunityResponseDto, type IGetCommunityDto } from '../dtos/community.dto';
import { CommunityService } from '../services/community.service';

export class CommunityController extends BaseController {
  private readonly _communityService: CommunityService;
  constructor() {
    super();
    this._communityService = Container.get(CommunityService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result: IGetCommunityDto = await this._communityService.get(this.getCurrentUserId(req));
      res.status(StatusCode.SuccessOK).json(new GetCommunityResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
