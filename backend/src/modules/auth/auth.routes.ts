import express from 'express';
import { AuthController } from '@modules/auth/controllers/auth.controller';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { Routes } from '@interfaces/routes.interface';
import { AuthMiddleware } from '@modules/auth/middlewares/auth.middleware';
import { ValidationMiddleware } from '@middlewares/validation.middleware';

export class AuthRoute implements Routes {
  public path = '/';
  public router = express.Router();
  public authController: AuthController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    //this.router.post(`${this.path}signup`, ValidationMiddleware(CreateUserDto), this.authController.signUp);
    this.router.post(`${this.path}login`, ValidationMiddleware(CreateUserDto), this.authController.logIn);
    //this.router.post(`${this.path}logout`, AuthMiddleware, this.authController.logOut);
  }
}
