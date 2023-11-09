import express from 'express';
import { UsersController } from '@modules/users/controllers/users.controller';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class UserRoute implements Routes {
  public path = '/users';
  public router = express.Router();
  public usersController: UsersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.usersController.getUsers);
    this.router.get(`${this.path}/:id(\\d+)`, this.usersController.getUserById);
    this.router.post(`${this.path}`, ValidationMiddleware(CreateUserDto), this.usersController.createUser);
    this.router.put(`${this.path}/:id(\\d+)`, ValidationMiddleware(UpdateUserDto, true), this.usersController.updateUser);
    this.router.delete(`${this.path}/:id(\\d+)`, this.usersController.deleteUser);
  }
}
