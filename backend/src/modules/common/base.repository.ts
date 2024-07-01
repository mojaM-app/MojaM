import { DbConnection, DbContext } from '@db';
import { CacheService } from '@modules/common';
import { Container } from 'typedi';

export abstract class BaseRepository {
  protected readonly _dbContext: DbContext;
  protected readonly _cacheService: CacheService;

  public constructor() {
    this._dbContext = DbConnection.getDbContext();
    this._cacheService = Container.get(CacheService);
  }
}
