import { events } from '@events/events';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { PermissionService } from '@modules/permissions/services/permissions.service';
import { NextFunction, Response } from 'express';
import { Guid } from 'guid-typescript';
import { Container } from 'typedi';

export class PermissionsController {
  private _permissionService: PermissionService | undefined = undefined;
  constructor() {
    this._permissionService = Container.get(PermissionService);
  }

  public add = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId, currentUserId } = this.getRequestParams(req);
      const result: boolean = await this._permissionService.add(userGuid, permissionId, currentUserId);
      res.status(201).json({ data: result, message: events.permissions.permissionAdded });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId } = this.getRequestParams(req);
      const result: boolean = await this._permissionService.delete(userGuid, permissionId);
      res.status(200).json({ data: result, message: events.permissions.permissionDeleted });
    } catch (error) {
      next(error);
    }
  };

  private getRequestParams(req: RequestWithUser): { userGuid: Guid; permissionId: number; currentUserId: number } {
    const userGuid: Guid = Guid.parse(req.params.userId);
    const permissionId: number = Number.parseInt(req.params.permissionId);
    const currentUserId: number = req.user.id;
    return { userGuid, permissionId, currentUserId };
  }
}
