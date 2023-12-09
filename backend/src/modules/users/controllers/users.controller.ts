import { events } from '@events/events';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { UserService } from '@modules/users/services/users.service';
import { User } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { Guid } from 'guid-typescript';
import { Container } from 'typedi';
import UsersHelper from '../helpers/users.helper';

export class UsersController {
  public userService = Container.get(UserService);

  // public getUsers = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const findAllUsersData: IUser[] = await this.userService.findAllUser();

  //     res.status(200).json({ data: findAllUsersData, message: 'findAll' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public getById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid: Guid = Guid.parse(req.params.id);
      const user: User = await this.userService.get(userGuid);

      res.status(200).json({ data: UsersHelper.UserToIUser(user), message: events.users.userRetrieved });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;
      const user: User = await this.userService.create(userData);
      res.status(201).json({ data: UsersHelper.UserToIUser(user), message: events.users.userCreated });
    } catch (error) {
      next(error);
    }
  };

  // public updateUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userId = Number(req.params.id);
  //     const userData: IUser = req.body;
  //     const updateUserData: IUser = await this.userService.updateUser(userId, userData);
  //     res.status(200).json({ data: updateUserData, message: 'updated' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public delete = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userGuid: Guid = Guid.parse(req.params.id);
      const data: string = await this.userService.delete(userGuid);
      res.status(200).json({ data: data, message: events.users.userDeleted });
    } catch (error) {
      next(error);
    }
  };
}
