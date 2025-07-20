import { BaseService } from '@core';
import { BadRequestException, ConflictException, errorKeys } from '@exceptions';
import { isNullOrUndefined } from '@utils';
import { Service } from 'typedi';
import { CreateBulletinQuestionAnswerDto } from '../dtos/create-bulletin-question-answer.dto';
import { CreateBulletinQuestionDto } from '../dtos/create-bulletin-question.dto';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { PublishBulletinDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinDto } from '../dtos/update-bulletin.dto';
import { BulletinRepository } from '../repositories/bulletin.repository';

@Service()
export class BulletinService extends BaseService {
  constructor(private readonly _bulletinRepository: BulletinRepository) {
    super();
  }

  public async get(bulletinId: number): Promise<any> {
    if (isNullOrUndefined(bulletinId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const bulletin = await this._bulletinRepository.get(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    return bulletin;
  }

  public async create(reqDto: CreateBulletinDto): Promise<any> {
    if (isNullOrUndefined(reqDto.title) || !reqDto.title.trim() || isNullOrUndefined(reqDto.currentUserId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    // Check if bulletin with this title already exists
    const existingBulletin = await this._bulletinRepository.getByTitle(reqDto.title);
    if (existingBulletin) {
      throw new ConflictException(errorKeys.bulletin.DateRangeConflict);
    }

    const bulletin = await this._bulletinRepository.create(reqDto, reqDto.currentUserId!);

    return bulletin;
  }

  public async update(reqDto: UpdateBulletinDto): Promise<any> {
    if (isNullOrUndefined(reqDto.bulletinId) || isNullOrUndefined(reqDto.currentUserId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const bulletinId = reqDto.bulletinId!;
    const currentUserId = reqDto.currentUserId!;

    const bulletin = await this._bulletinRepository.get(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    if (bulletin.isPublished) {
      throw new ConflictException(errorKeys.bulletin.BulletinAlreadyPublished);
    }

    // Check title uniqueness if title is being updated
    if (reqDto.title && reqDto.title !== bulletin.title) {
      const existingBulletin = await this._bulletinRepository.getByTitle(reqDto.title);
      if (existingBulletin && existingBulletin.id !== bulletinId) {
        throw new ConflictException(errorKeys.bulletin.DateRangeConflict);
      }
    }

    await this._bulletinRepository.update(bulletinId, reqDto, currentUserId);
    const updatedBulletin = await this._bulletinRepository.get(bulletinId);

    return updatedBulletin;
  }

  public async publish(reqDto: PublishBulletinDto): Promise<boolean> {
    if (isNullOrUndefined(reqDto.bulletinId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const bulletin = await this._bulletinRepository.get(reqDto.bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    if (bulletin.isPublished) {
      return true;
    }

    // Check if bulletin has valid content
    if (!bulletin.title || bulletin.daysCount <= 0) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const result = await this._bulletinRepository.publish(reqDto.bulletinId!, reqDto.currentUserId!);

    // Send notification about new published bulletin
    this.sendNewBulletinNotification(bulletin);

    return result;
  }

  private async sendNewBulletinNotification(bulletin: any): Promise<void> {
    try {
      // TODO: Implement actual notification logic
      // This could send emails to subscribers, push notifications, etc.
      console.info(`Bulletin published: ${bulletin.title} - Start date: ${bulletin.startDate}`);

      // Example: Send email to all users subscribed to bulletin notifications
      // const emailService = Container.get(EmailService);
      // await emailService.sendBulletinNotification(bulletin);
    } catch (error) {
      // Log error but don't fail the publish operation
      console.error('Failed to send bulletin notification:', error);
    }
  }

  public async getAll(): Promise<any[]> {
    return await this._bulletinRepository.getAll();
  }

  public async getPublished(): Promise<any[]> {
    return await this._bulletinRepository.getPublishedBulletins();
  }

  public async delete(bulletinId: number, currentUserId: number): Promise<void> {
    if (isNullOrUndefined(bulletinId) || isNullOrUndefined(currentUserId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const bulletin = await this._bulletinRepository.get(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    await this._bulletinRepository.delete(bulletinId);
  }

  public async getUserProgress(bulletinId: number, userId: number): Promise<any> {
    if (isNullOrUndefined(bulletinId) || isNullOrUndefined(userId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const bulletin = await this._bulletinRepository.get(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    if (!bulletin.isPublished) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    return await this._bulletinRepository.getUserProgress(bulletinId, userId);
  }

  public async createQuestion(reqDto: CreateBulletinQuestionDto, currentUserId: number): Promise<any> {
    if (
      isNullOrUndefined(reqDto.bulletinDayId) ||
      isNullOrUndefined(reqDto.content) ||
      isNullOrUndefined(currentUserId)
    ) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    // Check if the bulletin day exists and user has permission
    const bulletinDay = await this._bulletinRepository.getBulletinDayById(reqDto.bulletinDayId);
    if (!bulletinDay) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const question = await this._bulletinRepository.createQuestion(reqDto, currentUserId);
    return question;
  }

  public async answerQuestion(reqDto: CreateBulletinQuestionAnswerDto, currentUserId: number): Promise<any> {
    if (isNullOrUndefined(reqDto.questionId) || isNullOrUndefined(reqDto.content) || isNullOrUndefined(currentUserId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    // Check if the question exists
    const question = await this._bulletinRepository.getQuestionById(reqDto.questionId);
    if (!question) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const answer = await this._bulletinRepository.createQuestionAnswer(reqDto, currentUserId);
    return answer;
  }

  public async getBulletinQuestions(bulletinId: number): Promise<any[]> {
    if (isNullOrUndefined(bulletinId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const bulletin = await this._bulletinRepository.get(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    return await this._bulletinRepository.getBulletinQuestions(bulletinId);
  }

  public async getQuestionAnswers(questionId: number): Promise<any[]> {
    if (isNullOrUndefined(questionId)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const question = await this._bulletinRepository.getQuestionById(questionId);
    if (!question) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    return await this._bulletinRepository.getQuestionAnswers(questionId);
  }
}
