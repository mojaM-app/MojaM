import { RequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { GetUserProfileReqDto, GetUserProfileResponseDto, IUserProfileDto, UsersProfileService } from '@modules/users';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class UserProfileController extends BaseController {
  private readonly _userProfileService: UsersProfileService;

  public constructor() {
    super();
    this._userProfileService = Container.get(UsersProfileService);
  }

  public get = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserProfileReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result: IUserProfileDto | null = await this._userProfileService.get(reqDto);
      res.status(200).json(new GetUserProfileResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): string | undefined {
    return isGuid(req?.params?.id) ? req.params.id : undefined;
  }
}
