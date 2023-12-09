import { events } from '@events/events';
import { LoginDto } from '@modules/auth/dtos/login.dto';
import { AuthService } from '@modules/auth/services/auth.service';
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';

export class AuthController {
  public authService = Container.get(AuthService);

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginDto = req.body;
      const { cookie, user } = await this.authService.login(loginData);

      res.setHeader('Set-Cookie', cookie);
      res.status(200).json({ data: user, message: events.users.userLoggedIn });
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
