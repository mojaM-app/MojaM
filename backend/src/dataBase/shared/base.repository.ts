import { DbConnectionManager } from '../dbConnectionManager';
import type { DbContext } from '../dbContext';

export abstract class BaseRepository {
  protected readonly _dbContext: DbContext;

  constructor() {
    this._dbContext = DbConnectionManager.getDbContext();
  }
}
