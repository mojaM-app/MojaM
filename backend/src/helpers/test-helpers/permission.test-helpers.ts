import { SystemPermissions } from '@core/enums/system-permissions.enum';
import { PermissionsRoute } from '@modules/permissions/routes/permissions.routes';
import { isNumber } from '@utils';
import request, { type Response } from 'supertest';
import { type ITestApp } from './test-helpers.interface';

export class PermissionsHelpers {
  constructor(private readonly _app: ITestApp) {}

  public async get(accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .get(PermissionsRoute.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async add(userId: string, permission: SystemPermissions | string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .post(`${PermissionsRoute.path}/${userId}/${permission.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async delete(userId: string, permission: SystemPermissions | string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .delete(`${PermissionsRoute.path}/${userId}/${permission.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async removeAllUserPermissions(userId: string, accessToken?: string): Promise<Response> {
    return await request(this._app.getServer())
      .delete(`${PermissionsRoute.path}/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async addAllPermissionsToUser(
    userId: string,
    accessToken: string | undefined,
    permissionsToSkip?: SystemPermissions[],
  ): Promise<Response | undefined> {
    let addPermissionResponse: Response | undefined;

    for (const permission of Object.values(SystemPermissions)) {
      if (isNumber(permission)) {
        const value = permission as number;
        if (permissionsToSkip?.includes(value)) {
          continue;
        }

        addPermissionResponse = await request(this._app.getServer())
          .post(`${PermissionsRoute.path}/${userId}/${permission.toString()}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send();

        if (addPermissionResponse?.statusCode !== 201) {
          break; // Stop if any permission fails to add
        }
      }
    }

    return addPermissionResponse;
  }
}
