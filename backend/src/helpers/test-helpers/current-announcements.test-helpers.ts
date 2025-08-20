import { AnnouncementsRout } from '@modules/announcements/routes/announcements.routes';
import request, { type Response } from 'supertest';
import { type ITestApp } from './test-helpers.interface';

export class CurrentAnnouncementsHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(AnnouncementsRout.currentAnnouncementsPath)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
