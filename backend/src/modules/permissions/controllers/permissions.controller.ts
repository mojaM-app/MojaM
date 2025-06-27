import { BaseController, IRequestWithIdentity } from '@core';
import { isGuid, toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { AddPermissionReqDto, AddPermissionsResponseDto } from '../dtos/add-permission.dto';
import { DeletePermissionsReqDto, DeletePermissionsResponseDto } from '../dtos/delete-permissions.dto';
import { GetPermissionsReqDto, GetPermissionsResponseDto } from '../dtos/get-permissions.dto';
import { PermissionsService } from '../services/permissions.service';

export class PermissionsController extends BaseController {
  private readonly _permissionService: PermissionsService;

  constructor() {
    super();
    this._permissionService = Container.get(PermissionsService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqDto = new GetPermissionsReqDto(this.getCurrentUserId(req));
      const result = await this._permissionService.get(reqDto);
      res.status(StatusCode.SuccessOK).json(new GetPermissionsResponseDto(result));
    } catch (error) {
      next(error);
    }
  };

  public add = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId, currentUserId } = this.getRequestParams(req);
      const reqDto = new AddPermissionReqDto(userGuid, permissionId, currentUserId);
      const result = await this._permissionService.add(reqDto);
      if (result) {
        res.status(StatusCode.SuccessCreated).json(new AddPermissionsResponseDto(result));
      } else {
        res.status(StatusCode.ClientErrorBadRequest).json(new AddPermissionsResponseDto(result));
      }
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userGuid, permissionId, currentUserId } = this.getRequestParams(req);
      const reqDto = new DeletePermissionsReqDto(userGuid, permissionId, currentUserId);
      const result = await this._permissionService.delete(reqDto);
      if (result) {
        res.status(StatusCode.SuccessOK).json(new DeletePermissionsResponseDto(result));
      } else {
        res.status(StatusCode.ClientErrorBadRequest).json(new DeletePermissionsResponseDto(result));
      }
    } catch (error) {
      next(error);
    }
  };

  private getRequestParams(req: IRequestWithIdentity): {
    userGuid: string | undefined;
    permissionId: number | undefined;
    currentUserId: number | undefined;
  } {
    const userGuid = isGuid(req.params?.userId) ? req.params.userId : undefined;
    const permissionId = toNumber(req.params?.permissionId) ?? undefined;
    const currentUserId = this.getCurrentUserId(req);
    return { userGuid, permissionId, currentUserId };
  }
}
