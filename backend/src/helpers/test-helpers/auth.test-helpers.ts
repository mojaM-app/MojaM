import { IAccountTryingToLogInModel, ILoginModel, TLoginResult } from '@core';
import { AuthRoute } from '@modules/auth/routes/auth.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class AuthHelpers {
  constructor(private app: ITestApp) {}

  public async loginAs(user: {
    email?: string;
    phone?: string;
    passcode?: string | null;
  }): Promise<TLoginResult | null> {
    const loginDto = { email: user.email, phone: user.phone, passcode: user.passcode } satisfies ILoginModel;
    try {
      const loginResponse: Response = await request(this.app.getServer()).post(AuthRoute.loginPath).send(loginDto);
      const loginResult: TLoginResult = loginResponse.statusCode === 200 ? loginResponse.body.data : {};
      return loginResult;
    } catch (error) {
      console.error('Error in loginAs:', error);
      return null;
    }
  }

  public async login(model: ILoginModel): Promise<Response> {
    return await request(this.app.getServer()).post(AuthRoute.loginPath).send(model);
  }

  public async getAccountBeforeLogIn(model: IAccountTryingToLogInModel): Promise<Response> {
    return await request(this.app.getServer()).post(AuthRoute.getAccountBeforeLogInPath).send(model);
  }

  public async requestResetPasscode(model: IAccountTryingToLogInModel): Promise<Response> {
    return await request(this.app.getServer()).post(AuthRoute.requestResetPasscodePath).send(model);
  }
}
