import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import {
  GetUserProfileReqDto,
  GetUserProfileResponseDto,
  UpdateUserProfileDto,
  UpdateUserProfileReqDto,
  UpdateUserProfileResponseDto,
  UserProfileService,
} from '@modules/users';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

export class UserProfileController extends BaseController {
  private readonly _service: UserProfileService;

  constructor() {
    super();
    this._service = Container.get(UserProfileService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserProfileReqDto(this.getCurrentUserId(req));
      const result = await this._service.get(reqDto);
      res.status(200).json(new GetUserProfileResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyData: UpdateUserProfileDto = req.body;
      const reqDto = new UpdateUserProfileReqDto(this.getCurrentUserId(req), bodyData);
      const result = await this._service.update(reqDto);
      res.status(200).json(new UpdateUserProfileResponseDto(result));
    } catch (error) {
      next(error);
    }
  };
}
