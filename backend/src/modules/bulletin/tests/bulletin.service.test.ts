import { BadRequestException, ConflictException } from '@exceptions';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Container } from 'typedi';
import { CreateBulletinDto } from '../dtos/create-bulletin.dto';
import { PublishBulletinDto } from '../dtos/publish-bulletin.dto';
import { UpdateBulletinDto } from '../dtos/update-bulletin.dto';
import { BulletinRepository } from '../repositories/bulletin.repository';
import { BulletinService } from '../services/bulletin.service';

describe('BulletinService', () => {
  let bulletinService: BulletinService;
  let mockBulletinRepository: jest.Mocked<BulletinRepository>;

  beforeEach(() => {
    // Create mock repository
    mockBulletinRepository = {
      create: jest.fn(),
      getById: jest.fn(),
      getByTitle: jest.fn(),
      getAll: jest.fn(),
      getPublishedBulletins: jest.fn(),
      update: jest.fn(),
      publish: jest.fn(),
      delete: jest.fn(),
      hasValidContent: jest.fn(),
      getUserProgress: jest.fn(),
    } as any;

    // Mock Container.get to return our mock repository
    jest.spyOn(Container, 'get').mockImplementation(token => {
      if (token === BulletinRepository) {
        return mockBulletinRepository as any;
      }
      return {} as any;
    });

    bulletinService = new BulletinService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a bulletin successfully', async () => {
      // Arrange
      const createDto: CreateBulletinDto = {
        title: 'Test Bulletin',
        startDate: '2025-01-01',
        daysCount: 7,
        days: [
          {
            dayNumber: 1,
            instructions: 'Day 1 instructions',
            tasks: [
              {
                taskOrder: 1,
                description: 'Task 1',
                hasCommentField: false,
              },
            ],
          },
        ],
        currentUserId: 1,
      };

      const mockBulletin = {
        id: 1,
        title: 'Test Bulletin',
        startDate: new Date('2025-01-01'),
        daysCount: 7,
        isPublished: false,
      };

      mockBulletinRepository.getByTitle.mockResolvedValue(null);
      mockBulletinRepository.create.mockResolvedValue(mockBulletin as any);

      // Act
      const result = await bulletinService.create(createDto);

      // Assert
      expect(mockBulletinRepository.getByTitle).toHaveBeenCalledWith(createDto.title);
      expect(mockBulletinRepository.create).toHaveBeenCalledWith(createDto, createDto.currentUserId);
      expect(result).toEqual(mockBulletin);
    });

    it('should throw BadRequestException when title is missing', async () => {
      // Arrange
      const createDto: CreateBulletinDto = {
        title: '',
        startDate: '2025-01-01',
        daysCount: 7,
        days: [],
        currentUserId: 1,
      };

      // Act & Assert
      await expect(bulletinService.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when title already exists', async () => {
      // Arrange
      const createDto: CreateBulletinDto = {
        title: 'Existing Bulletin',
        startDate: '2025-01-01',
        daysCount: 7,
        days: [],
        currentUserId: 1,
      };

      const existingBulletin = { id: 1, title: 'Existing Bulletin' };
      mockBulletinRepository.getByTitle.mockResolvedValue(existingBulletin as any);

      // Act & Assert
      await expect(bulletinService.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a bulletin successfully', async () => {
      // Arrange
      const updateDto: UpdateBulletinDto = {
        bulletinId: 1,
        title: 'Updated Bulletin',
        startDate: '2025-01-02',
        currentUserId: 1,
      };

      const existingBulletin = {
        id: 1,
        title: 'Original Bulletin',
        isPublished: false,
      };

      const updatedBulletin = {
        id: 1,
        title: 'Updated Bulletin',
        isPublished: false,
      };

      mockBulletinRepository.getById.mockResolvedValue(existingBulletin as any);
      mockBulletinRepository.getByTitle.mockResolvedValue(null);
      mockBulletinRepository.update.mockResolvedValue(true);
      mockBulletinRepository.getById
        .mockResolvedValueOnce(existingBulletin as any)
        .mockResolvedValueOnce(updatedBulletin as any);

      // Act
      const result = await bulletinService.update(updateDto);

      // Assert
      expect(mockBulletinRepository.getById).toHaveBeenCalledWith(updateDto.bulletinId);
      expect(mockBulletinRepository.update).toHaveBeenCalledWith(
        updateDto.bulletinId,
        updateDto,
        updateDto.currentUserId,
      );
      expect(result).toEqual(updatedBulletin);
    });

    it('should throw ConflictException when trying to update published bulletin', async () => {
      // Arrange
      const updateDto: UpdateBulletinDto = {
        bulletinId: 1,
        title: 'Updated Bulletin',
        currentUserId: 1,
      };

      const publishedBulletin = {
        id: 1,
        title: 'Published Bulletin',
        isPublished: true,
      };

      mockBulletinRepository.getById.mockResolvedValue(publishedBulletin as any);

      // Act & Assert
      await expect(bulletinService.update(updateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('publish', () => {
    it('should publish a bulletin successfully', async () => {
      // Arrange
      const publishDto: PublishBulletinDto = {
        bulletinId: 1,
        currentUserId: 1,
      };

      const draftBulletin = {
        id: 1,
        title: 'Draft Bulletin',
        daysCount: 7,
        isPublished: false,
      };

      mockBulletinRepository.getById.mockResolvedValue(draftBulletin as any);
      mockBulletinRepository.publish.mockResolvedValue(true);

      // Act
      const result = await bulletinService.publish(publishDto);

      // Assert
      expect(mockBulletinRepository.getById).toHaveBeenCalledWith(publishDto.bulletinId);
      expect(mockBulletinRepository.publish).toHaveBeenCalledWith(publishDto.bulletinId, publishDto.currentUserId);
      expect(result).toEqual(true);
    });

    it('should throw BadRequestException when bulletin has no valid content', async () => {
      // Arrange
      const publishDto: PublishBulletinDto = {
        bulletinId: 1,
        currentUserId: 1,
      };

      const draftBulletin = {
        id: 1,
        title: '', // Empty title
        daysCount: 0, // Invalid days count
        isPublished: false,
      };

      mockBulletinRepository.getById.mockResolvedValue(draftBulletin as any);

      // Act & Assert
      await expect(bulletinService.publish(publishDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a draft bulletin successfully', async () => {
      // Arrange
      const bulletinId = 1;
      const currentUserId = 1;

      const draftBulletin = {
        id: 1,
        title: 'Draft Bulletin',
        isPublished: false,
      };

      mockBulletinRepository.getById.mockResolvedValue(draftBulletin as any);
      mockBulletinRepository.delete.mockResolvedValue(undefined);

      // Act
      await bulletinService.delete(bulletinId, currentUserId);

      // Assert
      expect(mockBulletinRepository.getById).toHaveBeenCalledWith(bulletinId);
      expect(mockBulletinRepository.delete).toHaveBeenCalledWith(bulletinId);
    });

    it('should throw ConflictException when trying to delete published bulletin', async () => {
      // Arrange
      const bulletinId = 1;
      const currentUserId = 1;

      const publishedBulletin = {
        id: 1,
        title: 'Published Bulletin',
        isPublished: true,
      };

      mockBulletinRepository.getById.mockResolvedValue(publishedBulletin as any);

      // Act & Assert
      await expect(bulletinService.delete(bulletinId, currentUserId)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserProgress', () => {
    it('should get user progress for published bulletin', async () => {
      // Arrange
      const bulletinId = 1;
      const userId = 2;

      const publishedBulletin = {
        id: 1,
        title: 'Published Bulletin',
        isPublished: true,
      };

      const userProgress = {
        bulletinId,
        userId,
        completedDays: 3,
        totalDays: 7,
        currentDay: 4,
        isCompleted: false,
      };

      mockBulletinRepository.getById.mockResolvedValue(publishedBulletin as any);
      mockBulletinRepository.getUserProgress.mockResolvedValue(userProgress);

      // Act
      const result = await bulletinService.getUserProgress(bulletinId, userId);

      // Assert
      expect(mockBulletinRepository.getById).toHaveBeenCalledWith(bulletinId);
      expect(mockBulletinRepository.getUserProgress).toHaveBeenCalledWith(bulletinId, userId);
      expect(result).toEqual(userProgress);
    });
  });
});
