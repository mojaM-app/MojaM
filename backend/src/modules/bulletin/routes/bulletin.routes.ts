import { type IRoutes } from '@core';
import { requirePermission, setIdentity, validateData } from '@middlewares';
import { default as express } from 'express';
import { BulletinController } from '../controllers/bulletin.controller';
import { CreateBulletinQuestionAnswerDto } from '../dtos/create-bulletin-question-answer.dto';
import { CreateBulletinQuestionDto } from '../dtos/create-bulletin-question.dto';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { PublishBulletinDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinDto } from '../dtos/update-bulletin.dto';

export class BulletinRoutes implements IRoutes {
  public static path = '/bulletins';

  public router = express.Router();

  private readonly _bulletinController: BulletinController;

  constructor() {
    this._bulletinController = new BulletinController();
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    // Create new bulletin
    this.router.post(
      BulletinRoutes.path,
      [setIdentity, requirePermission(user => user.canAddBulletin()), validateData(CreateBulletinDto)],
      this._bulletinController.create,
    );

    // Get all bulletins
    this.router.get(
      BulletinRoutes.path,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.getAll,
    );

    // Get published bulletins
    this.router.get(`${BulletinRoutes.path}/published`, [setIdentity], this._bulletinController.getPublished);

    // Get specific bulletin
    this.router.get(
      `${BulletinRoutes.path}/:id(\\d+)`,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.get,
    );

    // Update bulletin
    this.router.put(
      `${BulletinRoutes.path}/:id(\\d+)`,
      [setIdentity, requirePermission(user => user.canEditBulletin()), validateData(UpdateBulletinDto)],
      this._bulletinController.update,
    );

    // Publish bulletin
    this.router.post(
      `${BulletinRoutes.path}/:id(\\d+)/publish`,
      [setIdentity, requirePermission(user => user.canPublishBulletin()), validateData(PublishBulletinDto)],
      this._bulletinController.publish,
    );

    // Delete bulletin
    this.router.delete(
      `${BulletinRoutes.path}/:id(\\d+)`,
      [setIdentity, requirePermission(user => user.canDeleteBulletin())],
      this._bulletinController.delete,
    );

    // Export bulletin to PDF
    this.router.get(
      `${BulletinRoutes.path}/:id(\\d+)/pdf`,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.exportToPdf,
    );

    // Download PDF (public access for published bulletins)
    this.router.get(`${BulletinRoutes.path}/:id(\\d+)/download`, this._bulletinController.downloadPdf);

    // Get user progress for a bulletin
    this.router.get(
      `${BulletinRoutes.path}/:id(\\d+)/progress/:userId(\\d+)`,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.getUserProgress,
    );

    // Create question for bulletin
    this.router.post(
      `${BulletinRoutes.path}/questions`,
      [
        setIdentity,
        requirePermission(user => user.canAnswerBulletinQuestion()),
        validateData(CreateBulletinQuestionDto),
      ],
      this._bulletinController.createQuestion,
    );

    // Answer a question
    this.router.post(
      `${BulletinRoutes.path}/questions/answers`,
      [
        setIdentity,
        requirePermission(user => user.canAnswerBulletinQuestion()),
        validateData(CreateBulletinQuestionAnswerDto),
      ],
      this._bulletinController.answerQuestion,
    );

    // Get all questions for a bulletin
    this.router.get(
      `${BulletinRoutes.path}/:id(\\d+)/questions`,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.getBulletinQuestions,
    );

    // Get answers for a specific question
    this.router.get(
      `${BulletinRoutes.path}/questions/:questionId(\\d+)/answers`,
      [setIdentity, requirePermission(user => user.canGetBulletin())],
      this._bulletinController.getQuestionAnswers,
    );
  }
}
