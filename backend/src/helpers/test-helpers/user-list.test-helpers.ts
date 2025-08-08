import { request, type Response } from 'supertest';
import { UserListRoute } from '@modules/users/routes/user-list.routes';
import { type ITestApp } from './test-helpers.interface';

export class UserListHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(UserListRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
