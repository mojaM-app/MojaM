import { Routes } from '@interfaces/routes.interface';
import { PermissionsController } from '@modules/permissions/controllers/permissions.controller';
import { REGEX_GUID_PATTERN, REGEX_INT_PATTERN } from '@utils/constants';
import express from 'express';
import { setIdentity } from '../auth/middlewares/set-identity.middleware';

export class PermissionsRoute implements Routes {
  public path = '/permissions';
  public router = express.Router();
  public permissionsController: PermissionsController = new PermissionsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/:userId(${REGEX_GUID_PATTERN})/:permissionId(${REGEX_INT_PATTERN})`, setIdentity, this.permissionsController.add);
    this.router.delete(
      `${this.path}/:userId(${REGEX_GUID_PATTERN})/:permissionId(${REGEX_INT_PATTERN})`,
      setIdentity,
      this.permissionsController.delete,
    );
  }
}
