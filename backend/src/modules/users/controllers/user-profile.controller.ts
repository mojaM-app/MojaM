import { BaseController, IRequestWithIdentity } from '@core';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { GetUserProfileReqDto, GetUserProfileResponseDto } from '../dtos/get-user-profile.dto';
import { UpdateUserProfileDto, UpdateUserProfileReqDto, UpdateUserProfileResponseDto } from '../dtos/update-user-profile.dto';
import { UserProfileService } from '../services/user-profile.service';

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
