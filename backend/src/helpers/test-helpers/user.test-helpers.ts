import type { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import type { UpdateUserDto } from '@modules/users/dtos/update-user.dto';
import { UserRoute } from '@modules/users/routes/user.routes';
import request, { type Response } from 'supertest';
import { type ITestApp } from './test-helpers.interface';

export class UserHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(userId: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(`${UserRoute.path}/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async create(userDto: CreateUserDto, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .post(UserRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(userDto);
  }

  public async update(userId: string, userDto: UpdateUserDto, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .put(`${UserRoute.path}/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(userDto);
  }

  public async delete(userId: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .delete(`${UserRoute.path}/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async activate(userId: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .post(`${UserRoute.path}/${userId}/${UserRoute.activatePath}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async deactivate(userId: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .post(`${UserRoute.path}/${userId}/${UserRoute.deactivatePath}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async unlock(userId: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .post(`${UserRoute.path}/${userId}/${UserRoute.unlockPath}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
