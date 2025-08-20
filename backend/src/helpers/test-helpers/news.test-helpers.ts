import { NewsRoutes } from '@modules/news/routes/news.routes';
import request, { type Response } from 'supertest';
import { type ITestApp } from './test-helpers.interface';

export class NewsHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(NewsRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
