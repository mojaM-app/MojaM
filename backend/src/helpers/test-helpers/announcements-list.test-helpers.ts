import { request, type Response } from 'supertest';
import { AnnouncementsListRoute } from '@modules/announcements/routes/announcements-list.routes';
import type { ITestApp } from './test-helpers.interface';

export class AnnouncementsListHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(AnnouncementsListRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
