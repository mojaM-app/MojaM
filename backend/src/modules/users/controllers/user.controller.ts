import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import {
  ActivateUserReqDto,
  ActivateUserResponseDto,
  CreateUserDto,
  CreateUserReqDto,
  CreateUserResponseDto,
  DeactivateUserReqDto,
  DeactivateUserResponseDto,
  DeleteUserReqDto,
  DeleteUserResponseDto,
  UsersService,
} from '@modules/users';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class UserController extends BaseController {
  private readonly _userService: UsersService;

  public constructor() {
    super();
    this._userService = Container.get(UsersService);
  }

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyData: CreateUserDto = req.body;
      const reqDto = new CreateUserReqDto(bodyData, this.getCurrentUserId(req));
      const result = await this._userService.create(reqDto);
      res.status(201).json(new CreateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._userService.delete(reqDto);
      res.status(200).json(new DeleteUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new ActivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._userService.activate(reqDto);
      res.status(200).json(new ActivateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeactivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._userService.deactivate(reqDto);
      res.status(200).json(new DeactivateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): string | undefined {
    return isGuid(req?.params?.id) ? req.params.id : undefined;
  }
}
