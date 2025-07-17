import { CreateAnnouncementsDto } from '@modules/announcements/dtos/create-announcements.dto';
import { AnnouncementsRout } from '@modules/announcements/routes/announcements.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class AnnouncementsHelpers {
  constructor(private app: ITestApp) {}

  public async create(model: CreateAnnouncementsDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(AnnouncementsRout.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }
}
