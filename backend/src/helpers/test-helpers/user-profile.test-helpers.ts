import { request, type Response } from 'supertest';
import type { UpdateUserProfileDto } from '@modules/users/dtos/update-user-profile.dto';
import { UserProfileRoute } from '@modules/users/routes/user-profile.routes';
import { type ITestApp } from './test-helpers.interface';

export class UserProfileHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(UserProfileRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async update(profileData: UpdateUserProfileDto, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .put(UserProfileRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(profileData);
  }
}
