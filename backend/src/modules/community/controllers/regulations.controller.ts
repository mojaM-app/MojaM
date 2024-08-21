import { RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { CommunityService, GetRegulationsResponseDto } from '@modules/community';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class RegulationsController extends BaseController {
  private readonly _communityService: CommunityService;
  constructor() {
    super();
    this._communityService = Container.get(CommunityService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: string = await this._communityService.getRegulations();
      res.status(200).json(new GetRegulationsResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}
