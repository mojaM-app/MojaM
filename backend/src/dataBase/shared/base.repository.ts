import { DbConnectionManager, DbContext } from '@db';

export abstract class BaseRepository {
  protected readonly _dbContext: DbContext;

  constructor() {
    this._dbContext = DbConnectionManager.getDbContext();
  }
}
