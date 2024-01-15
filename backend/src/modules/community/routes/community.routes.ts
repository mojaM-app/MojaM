import { Routes } from '@interfaces';
import { setIdentity } from '@modules/auth';
import { DiaconieController, MeetingsController, MissionController, RegulationsController, StructureController } from '@modules/community';
import express, { Router } from 'express';

class StructureRout implements Routes {
  public path = '/structure';
  private readonly _controller: StructureController;

  public constructor(
    public router: Router,
    private readonly _parentPath: string
  ) {
    this._controller = new StructureController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this._parentPath}${this.path}`, [setIdentity], this._controller.get);
  }
}

class RegulationsRout implements Routes {
  public path = '/regulations';
  private readonly _controller: RegulationsController;

  public constructor(
    public router: Router,
    private readonly _parentPath: string
  ) {
    this._controller = new RegulationsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this._parentPath}${this.path}`, [setIdentity], this._controller.get);
  }
}

class MissionRout implements Routes {
  public path = '/mission';
  private readonly _controller: MissionController;

  public constructor(
    public router: Router,
    private readonly _parentPath: string
  ) {
    this._controller = new MissionController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this._parentPath}${this.path}`, [setIdentity], this._controller.get);
  }
}

class MeetingsRout implements Routes {
  public path = '/meetings';
  private readonly _controller: MeetingsController;

  public constructor(
    public router: Router,
    private readonly _parentPath: string
  ) {
    this._controller = new MeetingsController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this._parentPath}${this.path}`, [setIdentity], this._controller.get);
  }
}

class DiaconieRout implements Routes {
  public path = '/diaconie';
  private readonly _controller: DiaconieController;

  public constructor(
    public router: Router,
    private readonly _parentPath: string
  ) {
    this._controller = new DiaconieController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this._parentPath}${this.path}`, [setIdentity], this._controller.get);
  }
}

export class CommunityRoute implements Routes {
  public path = '/community';
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
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
