import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { CommunityService, GetStructureResponseDto } from '@modules/community';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class StructureController extends BaseController {
  private readonly _communityService: CommunityService;
  constructor() {
    super();
    this._communityService = Container.get(CommunityService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result: string = await this._communityService.getStructure();
      res.status(200).json(new GetStructureResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
