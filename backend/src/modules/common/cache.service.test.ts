import { IHasGuidId } from '@interfaces';
import { isGuid } from '@utils';
import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';
import { CacheService } from './cache.service';

jest.mock('@utils', () => ({
  isGuid: jest.fn(),
}));

class TestEntity implements IHasGuidId {
  public readonly uuid: string;
  public readonly id: number;

  constructor(uuid: string, id: number) {
    this.uuid = uuid;
    this.id = id;
  }
}

class TestCacheService extends CacheService<TestEntity> {
  protected getEntityType(): string {
    return 'TestEntity';
  }
}

describe('CacheService', () => {
  let cacheService: TestCacheService;
  let cacheContainer: CacheContainer;

  beforeEach(() => {
    cacheService = new TestCacheService();
    cacheContainer = new CacheContainer(new MemoryStorage());
    (cacheService as any).cache = cacheContainer;
  });

  test('getIdFromCacheAsync should return undefined if guidId is not valid', async () => {
    const result = await cacheService.getIdFromCacheAsync('invalid-guid');
    expect(result).toBeUndefined();
  });

  test('getIdFromCacheAsync should return cached value if guidId is valid', async () => {
    (isGuid as jest.Mock).mockReturnValue(true);
    jest.spyOn(cacheContainer, 'getItem').mockResolvedValue(123);
    const result = await cacheService.getIdFromCacheAsync('valid-guid');
    expect(result).toBe(123);
  });

  test('saveIdInCacheAsync should not save if entity uuid is not valid', async () => {
    (isGuid as jest.Mock).mockReturnValue(false);
    const saveDataInCacheSpy = jest.spyOn<any, any>(cacheService, 'saveDataInCache');
    await cacheService.saveIdInCacheAsync(new TestEntity('invalid-guid', 123));
    expect(saveDataInCacheSpy).not.toHaveBeenCalled();
  });

  test('saveIdInCacheAsync should not save if entity is null', async () => {
    (isGuid as jest.Mock).mockReturnValue(false);
    const saveDataInCacheSpy = jest.spyOn<any, any>(cacheService, 'saveDataInCache');
    await cacheService.saveIdInCacheAsync(null);
    expect(saveDataInCacheSpy).not.toHaveBeenCalled();
  });

  test('saveIdInCacheAsync should not save if entity is null', async () => {
    (isGuid as jest.Mock).mockReturnValue(false);
    const saveDataInCacheSpy = jest.spyOn<any, any>(cacheService, 'saveDataInCache');
    await cacheService.saveIdInCacheAsync(undefined);
    expect(saveDataInCacheSpy).not.toHaveBeenCalled();
  });

  test('saveIdInCacheAsync should save if entity uuid is valid', async () => {
    (isGuid as jest.Mock).mockReturnValue(true);
    const saveDataInCacheSpy = jest.spyOn<any, any>(cacheService, 'saveDataInCache');
    await cacheService.saveIdInCacheAsync(new TestEntity('valid-guid', 123));
    expect(saveDataInCacheSpy).toHaveBeenCalledWith('testentity_id_valid-guid', 123, { isCachedForever: true });
  });

  test('removeIdFromCacheAsync should not remove if guidId is not valid', async () => {
    (isGuid as jest.Mock).mockReturnValue(false);
    const saveDataInCacheSpy = jest.spyOn<any, any>(cacheService, 'saveDataInCache');
    await cacheService.removeIdFromCacheAsync('invalid-guid');
    expect(saveDataInCacheSpy).not.toHaveBeenCalled();
  });

  test('removeIdFromCacheAsync should remove if guidId is valid', async () => {
    (isGuid as jest.Mock).mockReturnValue(true);
    const saveDataInCacheSpy = jest.spyOn<any, any>(cacheService, 'saveDataInCache');
    await cacheService.removeIdFromCacheAsync('valid-guid');
    expect(saveDataInCacheSpy).toHaveBeenCalledWith('testentity_id_valid-guid', undefined, {});
  });

  test('getIdCacheKey should return correct cache key', () => {
    const result = (cacheService as any).getIdCacheKey('test-guid');
    expect(result).toBe('testentity_id_test-guid');
  });

  test('getDataFromCache should return cached data', async () => {
    jest.spyOn(cacheContainer, 'getItem').mockResolvedValue(123);
    const result = await (cacheService as any).getDataFromCache('test-key');
    expect(result).toBe(123);
  });

  test('saveDataInCache should save data in cache', async () => {
    const setItemSpy = jest.spyOn(cacheContainer, 'setItem');
    await (cacheService as any).saveDataInCache('test-key', 123, { ttl: 60 });
    expect(setItemSpy).toHaveBeenCalledWith('test-key', 123, { ttl: 60 });
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });
});
