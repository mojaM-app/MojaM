import { events } from '@events';
import { RequestWithIdentity } from '@modules/auth';
import { BaseController } from '@modules/common';
import { AddPermissionReqDto, DeletePermissionsReqDto, PermissionService } from '@modules/permissions';
import { NextFunction, Response } from 'express';
import { Guid } from 'guid-typescript';
import { Container } from 'typedi';

export class PermissionsController extends BaseController {
  private _permissionService: PermissionService | undefined = undefined;
  constructor() {
    super();
    this._permissionService = Container.get(PermissionService);
  }

  public add = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId, currentUserId } = this.getRequestParams(req);
      const reqDto = new AddPermissionReqDto(userGuid, permissionId, currentUserId);
      const result: boolean = await this._permissionService.add(reqDto);
      res.status(201).json({ data: result, message: events.permissions.permissionAdded });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId, currentUserId } = this.getRequestParams(req);
      const reqDto = new DeletePermissionsReqDto(userGuid, permissionId, currentUserId);
      const result: boolean = await this._permissionService.delete(reqDto);
      res.status(200).json({ data: result, message: events.permissions.permissionDeleted });
    } catch (error) {
      next(error);
    }
  };

  private getRequestParams(req: RequestWithIdentity): { userGuid: Guid; permissionId: number | undefined; currentUserId: number | undefined } {
    const userGuid: Guid = Guid.parse(req.params.userId);
    const permissionId: number | undefined = req.params?.permissionId?.length ? Number.parseInt(req.params.permissionId) : undefined;
    const currentUserId: number | undefined = this.getCurrentUserId(req);
    return { userGuid, permissionId, currentUserId };
  }
}
