import { CommunityRoutes } from '@modules/community/routes/community.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class CommunityHelpers {
  constructor(private app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(CommunityRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
