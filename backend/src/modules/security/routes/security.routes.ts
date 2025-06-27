import express from 'express';
import { type IRoutes } from '@core';
import { SecurityController } from '../controllers/security.controller';

export class SecurityRoute implements IRoutes {
  public router = express.Router();
  public static path = '/security';
  private readonly _securityController: SecurityController;

  constructor() {
    this._securityController = new SecurityController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(`${SecurityRoute.path}/csp-report`, this._securityController.cspReport);
  }
}
