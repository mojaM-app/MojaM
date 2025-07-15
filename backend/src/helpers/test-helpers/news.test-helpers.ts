import { NewsRoutes } from '@modules/news/routes/news.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class NewsHelpers {
  constructor(private app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(NewsRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
