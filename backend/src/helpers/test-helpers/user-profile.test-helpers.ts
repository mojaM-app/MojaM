import { UpdateUserProfileDto } from '@modules/users/dtos/update-user-profile.dto';
import { UserProfileRoute } from '@modules/users/routes/user-profile.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class UserProfileHelpers {
  constructor(private app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(UserProfileRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async update(profileData: UpdateUserProfileDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .put(UserProfileRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(profileData);
  }
}
