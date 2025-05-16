import { EventDispatcherService } from '@events';
import { registerTestEventHandlers } from './../../../helpers/event-handler-tests.helper';
import { EventDispatcher } from 'event-dispatch';
import { UserRepository } from './user.repository';

describe('UserRepository tests', () => {
  const repository: UserRepository = new UserRepository();

  beforeAll(async () => {
    const eventDispatcher: EventDispatcher = EventDispatcherService.getEventDispatcher();
    registerTestEventHandlers(eventDispatcher);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
  });

  describe('getIdByUuid tests', () => {
    test('should return undefined when Uuid is null', async () => {
      const id = await repository.getIdByUuid(null);
      expect(id).toBeUndefined();
    });

    test('should return undefined when Uuid is undefined', async () => {
      const id = await repository.getIdByUuid(undefined);
      expect(id).toBeUndefined();
    });
  });

  describe('checkIfExists tests', () => {
    test('should throw BadRequestException when email is undefined', async () => {
      await expect(repository.checkIfExists({ email: undefined as any, phone: '123456789' })).rejects.toThrow();
    });

    test('should throw BadRequestException when email is null', async () => {
      await expect(repository.checkIfExists({ email: null as any, phone: '123456789' })).rejects.toThrow();
    });

    test('should throw BadRequestException when email is empty', async () => {
      await expect(repository.checkIfExists({ email: '', phone: '123456789' })).rejects.toThrow();
    });

    test('should throw BadRequestException when email is white space', async () => {
      await expect(repository.checkIfExists({ email: ' ', phone: '123456789' })).rejects.toThrow();
    });

    test('should throw BadRequestException when phone is null', async () => {
      await expect(repository.checkIfExists({ email: 'email@domain.com', phone: null as any })).rejects.toThrow();
    });

    test('should throw BadRequestException when phone is undefined', async () => {
      await expect(repository.checkIfExists({ email: 'email@domain.com', phone: undefined as any })).rejects.toThrow();
    });

    test('should throw BadRequestException when phone is empty', async () => {
      await expect(repository.checkIfExists({ email: 'email@domain.com', phone: '' })).rejects.toThrow();
    });

    test('should throw BadRequestException when phone is white space', async () => {
      await expect(repository.checkIfExists({ email: 'email@domain.com', phone: ' ' })).rejects.toThrow();
    });

    test('should throw BadRequestException when email and phone are null', async () => {
      await expect(repository.checkIfExists({ email: null as any, phone: null as any })).rejects.toThrow();
    });

    test('should throw BadRequestException when email and phone are empty', async () => {
      await expect(repository.checkIfExists({ email: '', phone: '' })).rejects.toThrow();
    });

    test('should throw BadRequestException when email and phone are white space', async () => {
      await expect(repository.checkIfExists({ email: ' ', phone: ' ' })).rejects.toThrow();
    });

    test('should throw BadRequestException when user is null', async () => {
      await expect(repository.checkIfExists(null)).rejects.toThrow();
    });

    test('should throw BadRequestException when user is undefined', async () => {
      await expect(repository.checkIfExists(undefined)).rejects.toThrow();
    });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
