import DBClient from '@db/DBClient';
import { CacheService } from '@modules/common/cache.service';
import { PrismaClient } from '@prisma/client';
import { Container } from 'typedi';

export class BaseRepository {
  protected readonly _dbContext: PrismaClient;
  protected readonly _cacheService: CacheService;

  public constructor() {
    this._dbContext = DBClient.getDbContext();
    this._cacheService = Container.get(CacheService);
  }
}
