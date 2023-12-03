import { events } from '@events/events';
import { PermissionService } from '@modules/permissions/services/permissions.service';
import { NextFunction, Request, Response } from 'express';
import { Guid } from 'guid-typescript';
import { Container } from 'typedi';

export class PermissionsController {
  public permissionService = Container.get(PermissionService);

  public add = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId } = this.getRequestParams(req);
      const result: boolean = await this.permissionService.add(userGuid, permissionId);
      res.status(201).json({ data: result, message: events.permissions.permissionAdded });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId } = this.getRequestParams(req);
      const result: boolean = await this.permissionService.delete(userGuid, permissionId);
      res.status(200).json({ data: result, message: events.permissions.permissionDeleted });
    } catch (error) {
      next(error);
    }
  };

  private getRequestParams(req: Request): { userGuid: Guid; permissionId: number } {
    const userGuid: Guid = Guid.parse(req.params.userId);
    const permissionId: number = Number.parseInt(req.params.permissionId);
    return { userGuid, permissionId };
  }
}
