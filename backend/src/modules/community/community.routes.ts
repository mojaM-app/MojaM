import { Routes } from '@interfaces/routes.interface';
import { DiaconieController } from '@modules/community/controllers/diaconie.controller';
import { MeetingsController } from '@modules/community/controllers/meetings.controller';
import { MissionController } from '@modules/community/controllers/mission.controller';
import { RegulationsController } from '@modules/community/controllers/regulations.controller';
import { StructureController } from '@modules/community/controllers/structure.controller';
import express, { Router } from 'express';
import { setIdentity } from '../auth/middlewares/set-identity.middleware';

class StructureRout implements Routes {
  public path = '/structure';
  private readonly _controller: StructureController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new StructureController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
  }
}

class RegulationsRout implements Routes {
  public path = '/regulations';
  private readonly _controller: RegulationsController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new RegulationsController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
  }
}

class MissionRout implements Routes {
  public path = '/mission';
  private readonly _controller: MissionController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new MissionController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
  }
}

class MeetingsRout implements Routes {
  public path = '/meetings';
  private readonly _controller: MeetingsController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new MeetingsController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
  }
}

class DiaconieRout implements Routes {
  public path = '/diaconie';
  private readonly _controller: DiaconieController | undefined = undefined;

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this._controller = new DiaconieController();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, setIdentity, this._controller.get);
  }
}

export class CommunityRoute implements Routes {
  public path = '/community';
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const diaconieRout: DiaconieRout = new DiaconieRout(this.router, this.path);
    diaconieRout.initializeRoutes();

    const meetingsRout: MeetingsRout = new MeetingsRout(this.router, this.path);
    meetingsRout.initializeRoutes();

    const missionRout: MissionRout = new MissionRout(this.router, this.path);
    missionRout.initializeRoutes();

    const regulationsRout: RegulationsRout = new RegulationsRout(this.router, this.path);
    regulationsRout.initializeRoutes();

    const structureRout: StructureRout = new StructureRout(this.router, this.path);
    structureRout.initializeRoutes();
  }
}
