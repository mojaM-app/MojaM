import type { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { BaseController, type IRequestWithIdentity } from '@core';
import { isGuid } from '@utils';
import { ActivateUserReqDto, ActivateUserResponseDto } from '../dtos/activate-user.dto';
import { type CreateUserDto, CreateUserReqDto, CreateUserResponseDto } from '../dtos/create-user.dto';
import { DeactivateUserReqDto, DeactivateUserResponseDto } from '../dtos/deactivate-user.dto';
import { DeleteUserReqDto, DeleteUserResponseDto } from '../dtos/delete-user.dto';
import { GetUserReqDto, GetUserResponseDto } from '../dtos/get-user.dto';
import { UnlockUserReqDto, UnlockUserResponseDto } from '../dtos/unlock-user.dto';
import { type UpdateUserDto, UpdateUserReqDto, UpdateUserResponseDto } from '../dtos/update-user.dto';
import { UsersService } from '../services/user.service';

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
      res.status(StatusCode.SuccessOK).json(new GetUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyData: CreateUserDto = req.body;
      const reqDto = new CreateUserReqDto(bodyData, this.getCurrentUserId(req));
      const result = await this._service.create(reqDto);
      res.status(StatusCode.SuccessCreated).json(new CreateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bodyData: UpdateUserDto = req.body;
      const reqDto = new UpdateUserReqDto(this.getUserGuid(req), bodyData, this.getCurrentUserId(req));
      const result = await this._service.update(reqDto);
      res.status(StatusCode.SuccessOK).json(new UpdateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeleteUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.delete(reqDto);
      res.status(StatusCode.SuccessOK).json(new DeleteUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new ActivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.activate(reqDto);
      res.status(StatusCode.SuccessOK).json(new ActivateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new DeactivateUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.deactivate(reqDto);
      res.status(StatusCode.SuccessOK).json(new DeactivateUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public unlock = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new UnlockUserReqDto(this.getUserGuid(req), this.getCurrentUserId(req));
      const result = await this._service.unlock(reqDto);
      res.status(StatusCode.SuccessOK).json(new UnlockUserResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): string | undefined {
    return isGuid(req.params.id) ? req.params.id : undefined;
  }
}
