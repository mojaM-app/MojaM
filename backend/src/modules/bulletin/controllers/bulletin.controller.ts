import { BaseController, type IRequestWithIdentity } from '@core';
import { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import { Container } from 'typedi';
import { CreateBulletinQuestionAnswerDto } from '../dtos/create-bulletin-question-answer.dto';
import { CreateBulletinQuestionDto } from '../dtos/create-bulletin-question.dto';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { PublishBulletinDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinDto } from '../dtos/update-bulletin.dto';
import { BulletinPdfService } from '../services/bulletin-pdf.service';
import { BulletinService } from '../services/bulletin.service';

export class BulletinController extends BaseController {
  private readonly _bulletinService: BulletinService;
  private readonly _bulletinPdfService: BulletinPdfService;

  constructor() {
    super();
    this._bulletinService = Container.get(BulletinService);
    this._bulletinPdfService = Container.get(BulletinPdfService);
  }

  public get = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);
      const result = await this._bulletinService.get(bulletinId);

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = this.getCurrentUserId(req)!;
      const createDto: CreateBulletinDto = req.body;
      createDto.currentUserId = currentUserId;

      const result = await this._bulletinService.create(createDto);

      res.status(StatusCode.SuccessCreated).json(result);
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);
      const currentUserId = this.getCurrentUserId(req)!;
      const updateDto: UpdateBulletinDto = req.body;
      updateDto.bulletinId = bulletinId;
      updateDto.currentUserId = currentUserId;

      const result = await this._bulletinService.update(updateDto);

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };

  public publish = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);
      const currentUserId = this.getCurrentUserId(req)!;
      const publishDto: PublishBulletinDto = req.body;
      publishDto.bulletinId = bulletinId;
      publishDto.currentUserId = currentUserId;

      const result = await this._bulletinService.publish(publishDto);

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);
      const currentUserId = this.getCurrentUserId(req)!;

      await this._bulletinService.delete(bulletinId, currentUserId);

      res.status(StatusCode.SuccessOK).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  public exportToPdf = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);
      const currentUserId = this.getCurrentUserId(req)!;

      const pdfBuffer = await this._bulletinPdfService.generatePdf(bulletinId, currentUserId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bulletin_${bulletinId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  public downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);

      const result = await this._bulletinPdfService.downloadPdf(bulletinId);

      if (result.success && result.data) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="bulletin_${bulletinId}.pdf"`);
        res.send(result.data);
      } else {
        res.status(StatusCode.ClientErrorBadRequest).json(result);
      }
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Support pagination through query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      // For now, get all and handle pagination in memory
      // TODO: Implement pagination in repository for better performance
      const allBulletins = await this._bulletinService.getAll();

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBulletins = allBulletins.slice(startIndex, endIndex);

      const result = {
        data: paginatedBulletins,
        pagination: {
          page,
          limit,
          total: allBulletins.length,
          totalPages: Math.ceil(allBulletins.length / limit),
        },
      };

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getPublished = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._bulletinService.getPublished();

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getUserProgress = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const result = await this._bulletinService.getUserProgress(bulletinId, userId);

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };

  public createQuestion = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = this.getCurrentUserId(req)!;
      const createDto: CreateBulletinQuestionDto = req.body;

      const result = await this._bulletinService.createQuestion(createDto, currentUserId);

      res.status(StatusCode.SuccessCreated).json(result);
    } catch (error) {
      next(error);
    }
  };

  public answerQuestion = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = this.getCurrentUserId(req)!;
      const answerDto: CreateBulletinQuestionAnswerDto = req.body;

      const result = await this._bulletinService.answerQuestion(answerDto, currentUserId);

      res.status(StatusCode.SuccessCreated).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getBulletinQuestions = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bulletinId = parseInt(req.params.id);

      const result = await this._bulletinService.getBulletinQuestions(bulletinId);

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getQuestionAnswers = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
    try {
      const questionId = parseInt(req.params.questionId);

      const result = await this._bulletinService.getQuestionAnswers(questionId);

      res.status(StatusCode.SuccessOK).json(result);
    } catch (error) {
      next(error);
    }
  };
}
