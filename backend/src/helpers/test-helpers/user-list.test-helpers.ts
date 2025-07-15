import { UserListRoute } from '@modules/users/routes/user-list.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class UserListHelpers {
  constructor(private app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(UserListRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
