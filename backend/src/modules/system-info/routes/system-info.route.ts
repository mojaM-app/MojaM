import { IRoutes } from '@core';
import { requirePermission, setIdentity } from '@middlewares';
import { Router } from 'express';
import { SystemInfoController } from '../controllers/system-info.controller';

export class SystemInfoRoute implements IRoutes {
  public path = '/system-info';
  public router = Router();
  private systemInfoController = new SystemInfoController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      `${this.path}`,
      [setIdentity, requirePermission(user => user.canPreviewSystemInfo())],
      this.systemInfoController.getSystemInfo,
    );
  }
}
