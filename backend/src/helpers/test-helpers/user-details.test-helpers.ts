import { UserDetailsRoute } from '@modules/users/routes/user-details.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class UserDetailsHelpers {
  constructor(private app: ITestApp) {}

  public async get(userId: string, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(UserDetailsRoute.path + '/' + userId)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
