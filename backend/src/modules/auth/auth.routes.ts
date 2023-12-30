import { Routes } from '@interfaces/routes.interface';
import { validateData } from '@middlewares/validate-data.middleware';
import { AuthController } from '@modules/auth/controllers/auth.controller';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import express from 'express';

export class AuthRoute implements Routes {
  public path = '/';
  public loginPath = `${this.path}login`;
  public router = express.Router();

  private readonly _authController: AuthController | undefined = undefined;

  public constructor() {
    this._authController = new AuthController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(this.loginPath, validateData(LoginDto), this._authController.logIn);
    //this.router.post(`${this.path}logout`, verifyToken, this._authController.logOut);
  }
}
