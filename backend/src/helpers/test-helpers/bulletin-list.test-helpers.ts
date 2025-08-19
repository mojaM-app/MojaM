import { BulletinListRoutes } from '@modules/bulletin/routes/bulletin-list.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class BulletinListHelpers {
  constructor(private app: ITestApp) {}

  public async get(pageIndex?: number, pageSize?: number, accessToken?: string): Promise<Response> {
    let url = `${BulletinListRoutes.path}`;
    const params = new URLSearchParams();
    if (pageIndex !== undefined) params.append('pageIndex', pageIndex.toString());
    if (pageSize !== undefined) params.append('pageSize', pageSize.toString());
    if (params.toString()) url += '?' + params.toString();

    return await request(this.app.getServer()).get(url).set('Authorization', `Bearer ${accessToken}`).send();
  }
}
