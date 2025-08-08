import { request, type Response } from 'supertest';
import { LogListRoutes } from '@modules/log/routes/log-list.routes';
import { type ITestApp } from './test-helpers.interface';

export class LogListHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(LogListRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
