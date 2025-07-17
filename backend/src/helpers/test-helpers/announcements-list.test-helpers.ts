import { AnnouncementsListRoute } from '@modules/announcements/routes/announcements-list.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class AnnouncementsListHelpers {
  constructor(private app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(AnnouncementsListRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
