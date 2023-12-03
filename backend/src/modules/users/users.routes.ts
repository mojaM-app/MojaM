import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { UsersController } from '@modules/users/controllers/users.controller';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { REGEX_GUID_PATTERN } from '@utils/constants';
import express from 'express';

export class UsersRoute implements Routes {
  public path = '/users';
  public router = express.Router();
  public usersController: UsersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //this.router.get(`${this.path}`, this.usersController.getUsers);
    this.router.get(`${this.path}/:id(${REGEX_GUID_PATTERN})`, this.usersController.getById);
    this.router.post(`${this.path}`, ValidationMiddleware(CreateUserDto), this.usersController.create);
    //this.router.put(`${this.path}/:id(${REGEX_INT_PATTERN)`, ValidationMiddleware(UpdateUserDto, true), this.usersController.updateUser);
    this.router.delete(`${this.path}/:id(${REGEX_GUID_PATTERN})`, this.usersController.delete);
  }
}
