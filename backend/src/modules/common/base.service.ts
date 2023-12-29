import DBClient from '@db/DBClient';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import { PrismaClient, User } from '@prisma/client';
import { Guid } from 'guid-typescript';
import { CacheContainer } from 'node-ts-cache';
import { MemoryStorage } from 'node-ts-cache-storage-memory';
import StatusCode from 'status-code-enum';

const cache = new CacheContainer(new MemoryStorage());

export class BaseService {
  protected readonly _dbContext: PrismaClient;
  private readonly _userCacheKeyPrefix: string = 'user_id';

  constructor() {
    this._dbContext = DBClient.getDbContext();
  }

  protected async getUserId(userGuid: Guid): Promise<number | null> {
    const uuid = userGuid?.toString();

    if (!uuid?.length) {
      return null;
    }

    const cachedUserId = await this.getUserIdFromCache(uuid);
    if (cachedUserId) {
      return cachedUserId;
    }

    const count: number = await this._dbContext.user.count({ where: { uuid: uuid } });

    if (count > 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.general.More_Then_One_Record_With_Same_Id, [
        userGuid.toString(),
      ]);
    } else if (count === 0) {
      return null;
    }

    const user: User = await this._dbContext.user.findUnique({ where: { uuid: uuid } });

    await this.saveUserIdInCache(user);

    return user.id;
  }

  protected getUserIdFromCache(uuid: string): Promise<number> {
    const cacheKey = `${this._userCacheKeyPrefix}_${uuid}`;
    return this.getDataFromCache<number>(cacheKey);
  }

  protected saveUserIdInCache(user: User): Promise<void> {
    const cacheKey = `${this._userCacheKeyPrefix}_${user.uuid.toString()}`;
    return this.saveDataInCache(cacheKey, user.id, { isCachedForever: true });
  }

  protected getDataFromCache<T>(keyName: string): Promise<T> {
    return cache.getItem<T>(keyName);
  }

  protected saveDataInCache(keyName: string, data: any, options: { ttl?: number; isLazy?: boolean; isCachedForever?: boolean }): Promise<void> {
    return cache.setItem(keyName, data, options);
  }
}
