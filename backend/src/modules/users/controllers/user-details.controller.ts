import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import { GetUserDetailsReqDto, GetUserDetailsResponseDto, IUserDetailsDto, UsersDetailsService } from '@modules/users';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class UserDetailsController extends BaseController {
  private readonly _service: UsersDetailsService;

  constructor() {
    super();
    this._service = Container.get(UsersDetailsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserDetailsReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result: IUserDetailsDto | null = await this._service.get(reqDto);
      res.status(200).json(new GetUserDetailsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): string | undefined {
    return isGuid(req.params?.id) ? req.params.id : undefined;
  }
}
