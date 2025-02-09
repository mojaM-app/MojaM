import { IRequestWithIdentity } from '@interfaces';
import { BaseController } from '@modules/common';
import {
  AddPermissionReqDto,
  AddPermissionsResponseDto,
  DeletePermissionsReqDto,
  DeletePermissionsResponseDto,
  GetPermissionsReqDto,
  GetPermissionsResponseDto,
  PermissionsService,
} from '@modules/permissions';
import { isGuid, toNumber } from '@utils';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

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
      res.status(200).json(new GetPermissionsResponseDto(result));
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
        res.status(201).json(new AddPermissionsResponseDto(result));
      } else {
        res.status(400).json(new AddPermissionsResponseDto(result));
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
        res.status(200).json(new DeletePermissionsResponseDto(result));
      } else {
        res.status(400).json(new DeletePermissionsResponseDto(result));
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
    const userGuid = isGuid(req?.params?.userId) ? req.params.userId : undefined;
    const permissionId = toNumber(req?.params?.permissionId) ?? undefined;
    const currentUserId = this.getCurrentUserId(req);
    return { userGuid, permissionId, currentUserId };
  }
}
