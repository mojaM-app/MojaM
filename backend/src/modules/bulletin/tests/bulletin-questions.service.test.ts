import { BadRequestException } from '@exceptions';
import { CreateBulletinQuestionAnswerDto } from '../dtos/create-bulletin-question-answer.dto';
import { CreateBulletinQuestionDto } from '../dtos/create-bulletin-question.dto';
import { BulletinQuestionType } from '../enums/bulletin-question-type.enum';
import { BulletinService } from '../services/bulletin.service';

// Mock Container.get
jest.mock('typedi', () => ({
  Container: {
    get: jest.fn().mockReturnValue({
      getBulletinDayById: jest.fn(),
      createQuestion: jest.fn(),
      getQuestionById: jest.fn(),
      createQuestionAnswer: jest.fn(),
      getBulletinQuestions: jest.fn(),
      getQuestionAnswers: jest.fn(),
      getById: jest.fn(),
    }),
  },
  Service:
    () =>
    (target: any): any =>
      target,
}));

describe('BulletinService - Questions and Answers', () => {
  let bulletinService: BulletinService;
  let mockBulletinRepository: any;

  beforeEach(() => {
    // Get the mocked repository
    const { Container } = require('typedi');
    mockBulletinRepository = Container.get();

    bulletinService = new BulletinService();
    jest.clearAllMocks();
  });

  describe('createQuestion', () => {
    it('should create a question successfully', async () => {
      // Arrange
      const createDto: CreateBulletinQuestionDto = {
        bulletinDayId: 1,
        questionType: BulletinQuestionType.Private,
        content: 'This is a test question',
      };
      const currentUserId = 1;

      const mockBulletinDay = { id: 1, bulletinId: 1 };
      const mockQuestion = {
        id: 1,
        bulletinDayId: 1,
        questionType: BulletinQuestionType.Private,
        content: 'This is a test question',
        userId: 1,
      };

      mockBulletinRepository.getBulletinDayById.mockResolvedValue(mockBulletinDay);
      mockBulletinRepository.createQuestion.mockResolvedValue(mockQuestion);

      // Act
      const result = await bulletinService.createQuestion(createDto, currentUserId);

      // Assert
      expect(result).toEqual(mockQuestion);
      expect(mockBulletinRepository.getBulletinDayById).toHaveBeenCalledWith(1);
      expect(mockBulletinRepository.createQuestion).toHaveBeenCalledWith(createDto, currentUserId);
    });

    it('should throw BadRequestException when bulletin day does not exist', async () => {
      // Arrange
      const createDto: CreateBulletinQuestionDto = {
        bulletinDayId: 999,
        questionType: BulletinQuestionType.Private,
        content: 'This is a test question',
      };
      const currentUserId = 1;

      mockBulletinRepository.getBulletinDayById.mockResolvedValue(null);

      // Act & Assert
      await expect(bulletinService.createQuestion(createDto, currentUserId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when required fields are missing', async () => {
      // Arrange
      const createDto: CreateBulletinQuestionDto = {
        bulletinDayId: 1,
        questionType: BulletinQuestionType.Private,
        content: '',
      };
      const currentUserId = 1;

      // Act & Assert
      await expect(bulletinService.createQuestion(createDto, currentUserId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('answerQuestion', () => {
    it('should answer a question successfully', async () => {
      // Arrange
      const answerDto: CreateBulletinQuestionAnswerDto = {
        questionId: 1,
        content: 'This is a test answer',
      };
      const currentUserId = 1;

      const mockQuestion = { id: 1, bulletinDayId: 1, content: 'Test question' };
      const mockAnswer = {
        id: 1,
        questionId: 1,
        content: 'This is a test answer',
        userId: 1,
      };

      mockBulletinRepository.getQuestionById.mockResolvedValue(mockQuestion);
      mockBulletinRepository.createQuestionAnswer.mockResolvedValue(mockAnswer);

      // Act
      const result = await bulletinService.answerQuestion(answerDto, currentUserId);

      // Assert
      expect(result).toEqual(mockAnswer);
      expect(mockBulletinRepository.getQuestionById).toHaveBeenCalledWith(1);
      expect(mockBulletinRepository.createQuestionAnswer).toHaveBeenCalledWith(answerDto, currentUserId);
    });

    it('should throw BadRequestException when question does not exist', async () => {
      // Arrange
      const answerDto: CreateBulletinQuestionAnswerDto = {
        questionId: 999,
        content: 'This is a test answer',
      };
      const currentUserId = 1;

      mockBulletinRepository.getQuestionById.mockResolvedValue(null);

      // Act & Assert
      await expect(bulletinService.answerQuestion(answerDto, currentUserId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBulletinQuestions', () => {
    it('should get bulletin questions successfully', async () => {
      // Arrange
      const bulletinId = 1;
      const mockBulletin = { id: 1, title: 'Test Bulletin' };
      const mockQuestions = [
        { id: 1, content: 'Question 1' },
        { id: 2, content: 'Question 2' },
      ];

      mockBulletinRepository.getById.mockResolvedValue(mockBulletin);
      mockBulletinRepository.getBulletinQuestions.mockResolvedValue(mockQuestions);

      // Act
      const result = await bulletinService.getBulletinQuestions(bulletinId);

      // Assert
      expect(result).toEqual(mockQuestions);
      expect(mockBulletinRepository.getById).toHaveBeenCalledWith(bulletinId);
      expect(mockBulletinRepository.getBulletinQuestions).toHaveBeenCalledWith(bulletinId);
    });

    it('should throw BadRequestException when bulletin does not exist', async () => {
      // Arrange
      const bulletinId = 999;

      mockBulletinRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(bulletinService.getBulletinQuestions(bulletinId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getQuestionAnswers', () => {
    it('should get question answers successfully', async () => {
      // Arrange
      const questionId = 1;
      const mockQuestion = { id: 1, content: 'Test question' };
      const mockAnswers = [
        { id: 1, content: 'Answer 1' },
        { id: 2, content: 'Answer 2' },
      ];

      mockBulletinRepository.getQuestionById.mockResolvedValue(mockQuestion);
      mockBulletinRepository.getQuestionAnswers.mockResolvedValue(mockAnswers);

      // Act
      const result = await bulletinService.getQuestionAnswers(questionId);

      // Assert
      expect(result).toEqual(mockAnswers);
      expect(mockBulletinRepository.getQuestionById).toHaveBeenCalledWith(questionId);
      expect(mockBulletinRepository.getQuestionAnswers).toHaveBeenCalledWith(questionId);
    });

    it('should throw BadRequestException when question does not exist', async () => {
      // Arrange
      const questionId = 999;

      mockBulletinRepository.getQuestionById.mockResolvedValue(null);

      // Act & Assert
      await expect(bulletinService.getQuestionAnswers(questionId)).rejects.toThrow(BadRequestException);
    });
  });
});
