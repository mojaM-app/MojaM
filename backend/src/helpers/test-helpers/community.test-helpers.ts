import type { Response } from 'supertest';
import request from 'supertest';
import { CommunityRoutes } from '@modules/community/routes/community.routes';
import type { ITestApp } from './test-helpers.interface';

export class CommunityHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(CommunityRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
