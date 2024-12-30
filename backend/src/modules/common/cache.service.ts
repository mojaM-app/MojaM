import { IHasGuidId } from '@interfaces';
import { isGuid } from '@utils';
import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';

export abstract class CacheService<TEntity extends IHasGuidId> {
  private readonly cache: CacheContainer;

  public constructor() {
    this.cache = new CacheContainer(new MemoryStorage());
  }

  public async getIdFromCacheAsync(guidId: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(guidId)) {
      return undefined;
    }

    const cacheKey = this.getIdCacheKey(guidId!);
    return await this.getDataFromCache<number | undefined>(cacheKey);
  }

  public async saveIdInCacheAsync(entity: TEntity | null | undefined): Promise<void> {
    if (!isGuid(entity?.uuid)) {
      return;
    }

    const cacheKey = this.getIdCacheKey(entity!.uuid);
    await this.saveDataInCache(cacheKey, entity!.id, { isCachedForever: true });
  }

  public async removeIdFromCacheAsync(guidId: string | null | undefined): Promise<void> {
    if (!isGuid(guidId)) {
      return;
    }

    const cacheKey = this.getIdCacheKey(guidId!);
    await this.saveDataInCache(cacheKey, undefined, {});
  }

  protected abstract getEntityType(): string;

  private getIdCacheKey(guidId: string): string {
    return `${this.getEntityType().toLowerCase()}_id_${guidId}`;
  }

  private async getDataFromCache<T>(keyName: string): Promise<T | undefined> {
    return await this.cache.getItem<T | undefined>(keyName);
  }

  private async saveDataInCache(keyName: string, data: any, options: { ttl?: number; isLazy?: boolean; isCachedForever?: boolean }): Promise<void> {
    await this.cache.setItem(keyName, data, options);
  }
}
