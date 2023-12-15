import { Routes } from '@interfaces/routes.interface';
import { validateData } from '@middlewares/validate-data.middleware';
import { AuthController } from '@modules/auth/controllers/auth.controller';
import express from 'express';
import { LoginDto } from './dtos/login.dto';

export class AuthRoute implements Routes {
  public path = '/';
  public loginPath = `${this.path}login`;
  public router = express.Router();
  public authController: AuthController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(this.loginPath, validateData(LoginDto), this.authController.logIn);
    //this.router.post(`${this.path}logout`, verifyToken, this.authController.logOut);
  }
}
