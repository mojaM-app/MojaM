import { Routes } from '@interfaces/routes.interface';
import { DiaconieController } from '@modules/community/controllers/diaconie.controller';
import { MeetingsController } from '@modules/community/controllers/meetings.controller';
import { MissionController } from '@modules/community/controllers/mission.controller';
import { RegulationsController } from '@modules/community/controllers/regulations.controller';
import { StructureController } from '@modules/community/controllers/structure.controller';
import express, { Router } from 'express';

class StructureRout implements Routes {
  public path = '/structure';
  public controller: StructureController = new StructureController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, this.controller.get);
  }
}

class RegulationsRout implements Routes {
  public path = '/regulations';
  public controller: RegulationsController = new RegulationsController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, this.controller.get);
  }
}

class MissionRout implements Routes {
  public path = '/mission';
  public controller: MissionController = new MissionController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, this.controller.get);
  }
}

class MeetingsRout implements Routes {
  public path = '/meetings';
  public controller: MeetingsController = new MeetingsController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, this.controller.get);
  }
}

class DiaconieRout implements Routes {
  public path = '/diaconie';
  public controller: DiaconieController = new DiaconieController();

  public constructor(
    public router: Router,
    private _parentPath: string,
  ) {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this._parentPath}${this.path}`, this.controller.get);
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
