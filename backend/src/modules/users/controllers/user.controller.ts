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
  GetUserReqDto,
  GetUserResponseDto,
  UnlockUserReqDto,
  UnlockUserResponseDto,
  UpdateUserDto,
  UpdateUserReqDto,
  UpdateUserResponseDto,
  UsersService,
} from '@modules/users';
import { isGuid } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class UserController extends BaseController {
  private readonly _service: UsersService;

  constructor() {
    super();
    this._service = Container.get(UsersService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.get(reqDto);
      res.status(200).json(new GetUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyData: CreateUserDto = req.body;
      const reqDto = new CreateUserReqDto(bodyData, this.getCurrentUserId(req));
      const result = await this._service.create(reqDto);
      res.status(201).json(new CreateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyData: UpdateUserDto = req.body;
      const reqDto = new UpdateUserReqDto(this.getUserGuid(req), bodyData, this.getCurrentUserId(req));
      const result = await this._service.update(reqDto);
      res.status(200).json(new UpdateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.delete(reqDto);
      res.status(200).json(new DeleteUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new ActivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.activate(reqDto);
      res.status(200).json(new ActivateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeactivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.deactivate(reqDto);
      res.status(200).json(new DeactivateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public unlock = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new UnlockUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.unlock(reqDto);
      res.status(200).json(new UnlockUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): string | undefined {
    return isGuid(req.params?.id) ? req.params.id : undefined;
  }
}
