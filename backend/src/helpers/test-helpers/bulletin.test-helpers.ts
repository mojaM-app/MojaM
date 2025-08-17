import { CreateBulletinDto } from '@modules/bulletin/dtos/create-bulletin.dto';
import { UpdateBulletinDto } from '@modules/bulletin/dtos/update-bulletin.dto';
import { BulletinRoutes } from '@modules/bulletin/routes/bulletin.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class BulletinHelpers {
  constructor(private app: ITestApp) {}

  public async get(id: string, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`${BulletinRoutes.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async create(model: CreateBulletinDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(BulletinRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async update(id: string, model: UpdateBulletinDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .put(`${BulletinRoutes.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async publish(id: string, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(`${BulletinRoutes.path}/${id}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async delete(id: string, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .delete(`${BulletinRoutes.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
