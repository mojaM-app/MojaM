import type { CreateAnnouncementsDto } from '@modules/announcements/dtos/create-announcements.dto';
import type { UpdateAnnouncementsDto } from '@modules/announcements/dtos/update-announcements.dto';
import { AnnouncementsRout } from '@modules/announcements/routes/announcements.routes';
import request, { type Response } from 'supertest';
import type { ITestApp } from './test-helpers.interface';

export class AnnouncementsHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(id: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(`${AnnouncementsRout.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async create(model: CreateAnnouncementsDto, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .post(AnnouncementsRout.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async delete(id: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .delete(`${AnnouncementsRout.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  public async update(id: string, model: UpdateAnnouncementsDto, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .put(`${AnnouncementsRout.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async publish(id: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .post(`${AnnouncementsRout.path}/${id}/${AnnouncementsRout.publishPath}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getTopItems(accessToken?: string, excludeItems?: any[]): Promise<Response> {
    return await request(this._app.getServer())
      .post(`${AnnouncementsRout.path}/top-items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ excludeItems: excludeItems || [] });
  }
}
