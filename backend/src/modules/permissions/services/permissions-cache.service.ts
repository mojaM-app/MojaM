import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';
import { Service } from 'typedi';
import { SystemPermissions } from '../enums/system-permissions.enum';

@Service()
export class PermissionsCacheService {
  private readonly cache: CacheContainer;

  constructor() {
    this.cache = new CacheContainer(new MemoryStorage());
  }

  public async readAsync(userId: number): Promise<SystemPermissions[] | undefined> {
    if (userId > 0) {
      const cacheKey = this.getIdCacheKey(userId);
      return await this.getDataFromCache(cacheKey);
    }

    return undefined;
  }

  public async saveAsync(userId: number, permissions: SystemPermissions[]): Promise<void> {
    if (userId > 0) {
      const cacheKey = this.getIdCacheKey(userId);
      await this.saveDataInCache(cacheKey, permissions, { ttl: 300 });
    }
  }

  public async removeAsync(userId: number): Promise<void> {
    if (userId > 0) {
      const cacheKey = this.getIdCacheKey(userId);
      await this.saveDataInCache(cacheKey, undefined, {});
    }
  }

  private getIdCacheKey(userId: number): string {
    return `permissions_user_${userId}`;
  }

  private async getDataFromCache(keyName: string): Promise<SystemPermissions[] | undefined> {
    return await this.cache.getItem<SystemPermissions[] | undefined>(keyName);
  }

  private async saveDataInCache(
    keyName: string,
    data: SystemPermissions[] | undefined,
    options: { ttl?: number; isLazy?: boolean; isCachedForever?: boolean },
  ): Promise<void> {
    await this.cache.setItem(keyName, data, options);
  }
}
