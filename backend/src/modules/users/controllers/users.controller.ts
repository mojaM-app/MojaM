import { User } from '@db/DbModels';
import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import { ActivateUserReqDto, CreateUserDto, CreateUserPayload, DeactivateUserReqDto, DeleteUserReqDto, UsersService } from '@modules/users';
import UsersHelper from '@modules/users/helpers/users.helper';
import { NextFunction, Request, Response } from 'express';
import { Guid } from 'guid-typescript';
import { Container } from 'typedi';

export class UsersController extends BaseController {
  private readonly _userService: UsersService | undefined = undefined;

  public constructor() {
    super();
    this._userService = Container.get(UsersService);
  }

  // public getUsers = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const findAllUsersData: IUser[] = await this._userService.findAllUser();

  //     res.status(200).json({ data: findAllUsersData, message: 'findAll' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public getUserProfile = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid: Guid = this.getUserGuid(req);
      const user: User = await this._userService.get(userGuid);
      res.status(200).json({ data: UsersHelper.UserToIUserProfile(user), message: events.users.userRetrieved });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;
      const user: User = await this._userService.create(new CreateUserPayload(userData, req.identity.userId));
      res.status(201).json({ data: UsersHelper.UserToIUser(user), message: events.users.userCreated });
    } catch (error) {
      next(error);
    }
  };

  // public updateUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userId = Number(req.params.id);
  //     const userData: IUser = req.body;
  //     const updateUserData: IUser = await this._userService.updateUser(userId, userData);
  //     res.status(200).json({ data: updateUserData, message: 'updated' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public delete = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid: Guid = this.getUserGuid(req);
      const reqDto = new DeleteUserReqDto(userGuid, req.identity.userId);
      const data: string = await this._userService.delete(reqDto);
      res.status(200).json({ data: data, message: events.users.userDeleted });
    } catch (error) {
      next(error);
    }
  };

  public activate = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid: Guid = this.getUserGuid(req);
      const data: boolean = await this._userService.activate(new ActivateUserReqDto(userGuid, req.identity.userId));
      res.status(200).json({ data: data, message: events.users.userDeleted });
    } catch (error) {
      next(error);
    }
  };

  public deactivate = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid: Guid = this.getUserGuid(req);
      const data: boolean = await this._userService.deactivate(new DeactivateUserReqDto(userGuid, req.identity.userId));
      res.status(200).json({ data: data, message: events.users.userDeleted });
    } catch (error) {
      next(error);
    }
  };

  private getUserGuid(req: Request): Guid | undefined {
    return req.params?.id?.length ? Guid.parse(req.params.id) : undefined;
  }
}
