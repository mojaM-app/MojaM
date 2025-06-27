import type { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { BaseController, type IRequestWithIdentity } from '@core';
import { isGuid } from '@utils';
import { GetUserDetailsReqDto, GetUserDetailsResponseDto, type IUserDetailsDto } from '../dtos/get-user-details.dto';
import { UsersDetailsService } from '../services/user-details.service';

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
      res.status(StatusCode.SuccessOK).json(new GetUserDetailsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): string | undefined {
    return isGuid(req.params.id) ? req.params.id : undefined;
  }
}
