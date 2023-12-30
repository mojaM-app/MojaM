import { User } from '@prisma/client';
import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';
import { Service } from 'typedi';

@Service()
export class CacheService {
  private readonly cache: CacheContainer | undefined = undefined;

  public constructor() {
    this.cache = new CacheContainer(new MemoryStorage());
  }

  public getUserIdFromCacheAsync(uuid: string): Promise<number> {
    const cacheKey = this.getUserIdCacheKey(uuid);
    return this.getDataFromCache<number>(cacheKey);
  }

  public saveUserIdInCacheAsync(user: User): Promise<void> {
    const cacheKey = this.getUserIdCacheKey(user.uuid.toString());
    return this.saveDataInCache(cacheKey, user.id, { isCachedForever: true });
  }

  private getUserIdCacheKey(uuid: string): string {
    return `user_id_${uuid}`;
  }

  private getDataFromCache<T>(keyName: string): Promise<T> {
    return this.cache.getItem<T>(keyName);
  }

  private saveDataInCache(keyName: string, data: any, options: { ttl?: number; isLazy?: boolean; isCachedForever?: boolean }): Promise<void> {
    return this.cache.setItem(keyName, data, options);
  }
}
