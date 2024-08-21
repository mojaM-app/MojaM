import { RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { GetInformationDto, GetInformationResponseDto, InformationService } from '@modules/news';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class InformationController extends BaseController {
  private readonly _informationService: InformationService;

  public constructor() {
    super();
    this._informationService = Container.get(InformationService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: GetInformationDto = await this._informationService.get();
      res.status(200).json(new GetInformationResponseDto(data));
    } catch (error) {
      next(error);
    }
  };
}
