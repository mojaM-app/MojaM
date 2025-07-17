import { AnnouncementsRout } from '@modules/announcements/routes/announcements.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class CurrentAnnouncementsHelpers {
  constructor(private app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(AnnouncementsRout.currentAnnouncementsPath)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
