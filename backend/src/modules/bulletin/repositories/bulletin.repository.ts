import { BadRequestException, ConflictException, errorKeys } from '@exceptions';
import { isNullOrUndefined, isPositiveNumber } from '@utils';
import { Service } from 'typedi';
import { BaseBulletinRepository } from './base-bulletin.repository';
import { BulletinDayTask } from '../../../dataBase/entities/bulletin/bulletin-day-task.entity';
import { BulletinDay } from '../../../dataBase/entities/bulletin/bulletin-day.entity';
import { BulletinQuestionAnswer } from '../../../dataBase/entities/bulletin/bulletin-question-answer.entity';
import { BulletinQuestion } from '../../../dataBase/entities/bulletin/bulletin-question.entity';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';
import { CreateBulletinQuestionAnswerDto } from '../dtos/create-bulletin-question-answer.dto';
import { CreateBulletinQuestionDto } from '../dtos/create-bulletin-question.dto';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { UpdateBulletinDto } from '../dtos/update-bulletin.dto';
import { BulletinState } from '../enums/bulletin-state.enum';

@Service()
export class BulletinRepository extends BaseBulletinRepository {
  constructor() {
    super();
  }

  public async create(dto: CreateBulletinDto, userId: number): Promise<Bulletin> {
    // Validate required fields
    if (isNullOrUndefined(dto.title) || !dto.title.trim()) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    if (isNullOrUndefined(dto.startDate)) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    if (!dto.days || dto.days.length === 0) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const startDate = new Date(dto.startDate!);
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const daysCount = dto.daysCount || 7;

    // Check for date conflicts
    await this.validateDateRange(startDate, daysCount);

    return await this._dbContext.transaction(async manager => {
      // Create bulletin
      const bulletin = new Bulletin();
      bulletin.title = dto.title;
      bulletin.startDate = startDate;
      bulletin.daysCount = dto.daysCount || 7;
      bulletin.state = BulletinState.Draft;
      bulletin.createdBy = userId;

      const savedBulletin = await manager.save(Bulletin, bulletin);

      // Create days and tasks
      for (const dayDto of dto.days!) {
        const bulletinDay = new BulletinDay();
        bulletinDay.bulletinId = savedBulletin.id;
        bulletinDay.dayNumber = dayDto.dayNumber;
        bulletinDay.introduction = dayDto.introduction || null;
        bulletinDay.instructions = dayDto.instructions;

        const savedDay = await manager.save(BulletinDay, bulletinDay);

        // Create tasks for this day
        for (const taskDto of dayDto.tasks) {
          const bulletinDayTask = new BulletinDayTask();
          bulletinDayTask.bulletinDayId = savedDay.id;
          bulletinDayTask.taskOrder = taskDto.taskOrder;
          bulletinDayTask.description = taskDto.description;
          bulletinDayTask.hasCommentField = taskDto.hasCommentField || false;

          await manager.save(BulletinDayTask, bulletinDayTask);
        }
      }

      return savedBulletin;
    });
  }

  public async update(bulletinId: number, dto: UpdateBulletinDto, userId: number): Promise<boolean> {
    const bulletin = await this.getById(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : bulletin.startDate;

    // Check for date conflicts (excluding current bulletin)
    await this.validateDateRange(startDate, bulletin.daysCount, bulletin.uuid);

    return await this._dbContext.transaction(async manager => {
      // Update bulletin
      await manager.update(Bulletin, bulletinId, {
        title: dto.title,
        startDate: startDate,
        modifiedBy: userId,
      });

      // Delete existing days and tasks
      const existingDays = await manager.find(BulletinDay, {
        where: { bulletinId },
      });

      for (const day of existingDays) {
        await manager.delete(BulletinDayTask, { bulletinDayId: day.id });
      }
      await manager.delete(BulletinDay, { bulletinId });

      // Create new days and tasks
      for (const dayDto of dto.days!) {
        const bulletinDay = new BulletinDay();
        bulletinDay.bulletinId = bulletinId;
        bulletinDay.dayNumber = dayDto.dayNumber;
        bulletinDay.introduction = dayDto.introduction || null;
        bulletinDay.instructions = dayDto.instructions;

        const savedDay = await manager.save(BulletinDay, bulletinDay);

        // Create tasks for this day
        for (const taskDto of dayDto.tasks) {
          const bulletinDayTask = new BulletinDayTask();
          bulletinDayTask.bulletinDayId = savedDay.id;
          bulletinDayTask.taskOrder = taskDto.taskOrder;
          bulletinDayTask.description = taskDto.description;
          bulletinDayTask.hasCommentField = taskDto.hasCommentField || false;

          await manager.save(BulletinDayTask, bulletinDayTask);
        }
      }

      return true;
    });
  }

  public async publish(bulletinId: number, userId: number): Promise<boolean> {
    const bulletin = await this.getById(bulletinId);
    if (!bulletin) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }

    if (bulletin.isPublished) {
      throw new ConflictException(errorKeys.bulletin.BulletinAlreadyPublished);
    }

    const updateResult = await this._dbContext.bulletins.update(bulletinId, {
      state: BulletinState.Published,
      publishedBy: userId,
      publishedAt: new Date(),
    });

    return updateResult.affected! > 0;
  }

  public async delete(bulletinId: number): Promise<void> {
    // Use simple delete to let the database handle cascading
    const deleteResult = await this._dbContext.bulletins.delete({ id: bulletinId });
    
    if (deleteResult.affected === 0) {
      throw new BadRequestException(errorKeys.bulletin.BulletinNotFound);
    }
  }

  public async getById(id: number): Promise<Bulletin | null> {
    if (!isPositiveNumber(id)) {
      return null;
    }

    return await this._dbContext.bulletins.findOne({
      where: { id },
    });
  }

  public async getByUuid(uuid: string): Promise<Bulletin | null> {
    if (isNullOrUndefined(uuid)) {
      return null;
    }

    return await this._dbContext.bulletins.findOne({
      where: { uuid },
    });
  }

  public async getByTitle(title: string): Promise<Bulletin | null> {
    if (!title) {
      return null;
    }

    return await this._dbContext.bulletins.findOne({
      where: { title },
    });
  }

  public async getAll(): Promise<Bulletin[]> {
    return await this._dbContext.bulletins.find({
      relations: ['days', 'days.tasks', 'questions'],
      order: { createdAt: 'DESC' },
    });
  }

  public async hasValidContent(bulletinId: number): Promise<boolean> {
    const bulletin = await this._dbContext.bulletins.findOne({
      where: { id: bulletinId },
    });

    if (!bulletin) {
      return false;
    }

    // Check if bulletin has days with tasks
    const dayCount = await this._dbContext.bulletinDays.count({
      where: { bulletinId },
    });

    if (dayCount === 0) {
      return false;
    }

    // Check if at least one day has tasks
    const taskCount = await this._dbContext.bulletinDayTasks
      .createQueryBuilder('task')
      .innerJoin('task.bulletinDay', 'day')
      .where('day.bulletinId = :bulletinId', { bulletinId })
      .getCount();

    return taskCount > 0;
  }

  public async getUserProgress(bulletinId: number, userId: number): Promise<any> {
    // Implementation for user progress tracking
    return {
      bulletinId,
      userId,
      completedDays: 0,
      totalDays: 7,
      currentDay: 1,
      isCompleted: false,
    };
  }

  public async getWithDaysAndTasks(id: number): Promise<Bulletin | null> {
    if (!isPositiveNumber(id)) {
      return null;
    }

    const bulletin = await this._dbContext.bulletins.findOne({
      where: { id },
    });

    if (!bulletin) {
      return null;
    }

    // Load days and tasks separately to avoid circular dependencies
    const days = await this._dbContext.bulletinDays.find({
      where: { bulletinId: id },
      order: { dayNumber: 'ASC' },
    });

    for (const day of days) {
      const tasks = await this._dbContext.bulletinDayTasks.find({
        where: { bulletinDayId: day.id },
        order: { taskOrder: 'ASC' },
      });
      (day as any).tasks = tasks;
    }

    (bulletin as any).days = days;
    return bulletin;
  }

  public async getList(skip: number = 0, take: number = 50): Promise<Bulletin[]> {
    return await this._dbContext.bulletins.find({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  public async count(): Promise<number> {
    return await this._dbContext.bulletins.count();
  }

  public async getPublishedBulletins(): Promise<Bulletin[]> {
    return await this._dbContext.bulletins.find({
      where: { state: BulletinState.Published },
      order: { startDate: 'DESC' },
    });
  }

  public async getBulletinsForDate(date: Date): Promise<Bulletin[]> {
    const dateStr = date.toISOString().split('T')[0];

    return await this._dbContext.bulletins
      .createQueryBuilder('bulletin')
      .where('bulletin.state = :state', { state: BulletinState.Published })
      .andWhere('DATE(bulletin.startDate) <= :date', { date: dateStr })
      .andWhere('DATE_ADD(bulletin.startDate, INTERVAL (bulletin.daysCount - 1) DAY) >= :date', { date: dateStr })
      .getMany();
  }

  private async validateDateRange(startDate: Date, daysCount: number, excludeUuid?: string): Promise<void> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysCount - 1);

    let query = this._dbContext.bulletins
      .createQueryBuilder('bulletin')
      .where(
        '(DATE(bulletin.startDate) <= :endDate AND DATE_ADD(bulletin.startDate, INTERVAL (bulletin.daysCount - 1) DAY) >= :startDate)',
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      );

    if (excludeUuid) {
      query = query.andWhere('bulletin.uuid != :excludeUuid', { excludeUuid });
    }

    const conflictingBulletin = await query.getOne();

    if (conflictingBulletin) {
      throw new ConflictException(errorKeys.bulletin.DateRangeConflict);
    }
  }

  public async checkContinuity(startDate: Date): Promise<{ isValid: boolean; lastBulletinEndDate?: Date }> {
    const previousBulletins = await this._dbContext.bulletins.find({
      where: { state: BulletinState.Published },
      order: { startDate: 'DESC' },
      take: 1,
    });

    if (previousBulletins.length === 0) {
      return { isValid: true };
    }

    const lastBulletin = previousBulletins[0];
    const lastEndDate = lastBulletin.endDate;
    const nextExpectedDate = new Date(lastEndDate);
    nextExpectedDate.setDate(nextExpectedDate.getDate() + 1);

    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const expectedDateOnly = new Date(
      nextExpectedDate.getFullYear(),
      nextExpectedDate.getMonth(),
      nextExpectedDate.getDate(),
    );

    return {
      isValid: startDateOnly.getTime() === expectedDateOnly.getTime(),
      lastBulletinEndDate: lastEndDate,
    };
  }

  public async getBulletinDayById(bulletinDayId: number): Promise<BulletinDay | null> {
    return await this._dbContext.bulletinDays.findOne({
      where: { id: bulletinDayId },
      relations: ['bulletin'],
    });
  }

  public async createQuestion(dto: CreateBulletinQuestionDto, userId: number): Promise<BulletinQuestion> {
    const question = new BulletinQuestion();
    question.bulletinDayId = dto.bulletinDayId;
    question.questionType = dto.questionType;
    question.content = dto.content;
    question.userId = userId;

    return await this._dbContext.bulletinQuestions.save(question);
  }

  public async getQuestionById(questionId: number): Promise<BulletinQuestion | null> {
    return await this._dbContext.bulletinQuestions.findOne({
      where: { id: questionId },
      relations: ['bulletinDay', 'bulletinDay.bulletin'],
    });
  }

  public async createQuestionAnswer(
    dto: CreateBulletinQuestionAnswerDto,
    userId: number,
  ): Promise<BulletinQuestionAnswer> {
    const answer = new BulletinQuestionAnswer();
    answer.questionId = dto.questionId;
    answer.content = dto.content;
    answer.userId = userId;

    return await this._dbContext.bulletinQuestionAnswers.save(answer);
  }

  public async getBulletinQuestions(bulletinId: number): Promise<BulletinQuestion[]> {
    return await this._dbContext.bulletinQuestions
      .createQueryBuilder('question')
      .innerJoin('question.bulletinDay', 'day')
      .where('day.bulletinId = :bulletinId', { bulletinId })
      .orderBy('question.createdAt', 'DESC')
      .getMany();
  }

  public async getQuestionAnswers(questionId: number): Promise<BulletinQuestionAnswer[]> {
    return await this._dbContext.bulletinQuestionAnswers.find({
      where: { questionId },
      order: { createdAt: 'ASC' },
    });
  }
}
