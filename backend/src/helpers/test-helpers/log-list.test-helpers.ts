import { LogListRoutes } from '@modules/log/routes/log-list.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class LogListHelpers {
  constructor(private app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(LogListRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
