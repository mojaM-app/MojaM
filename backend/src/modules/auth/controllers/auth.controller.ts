import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@modules/auth/interfaces/auth.interface';
import { IUser } from '@modules/users/interfaces/user.interface';
import { AuthService } from '@modules/auth/services/auth.service';
import { LoginDto } from '@modules/auth/dtos/login.dto';

export class AuthController {
  public authService = Container.get(AuthService);

  // public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: IUser = req.body;
  //     const signUpUserData: IUser = await this.authService.signup(userData);

  //     res.status(201).json({ data: signUpUserData, message: 'signup' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;
      const { cookie, user } = await this.authService.login(loginData);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json({ data: user, message: 'login' });
    } catch (error) {
      next(error);
    }
  };

  // public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: IUser = req.user;
  //     const logOutUserData: IUser = await this.authService.logout(userData);

  //     res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
  //     res.status(200).json({ data: logOutUserData, message: 'logout' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
}
