import { DbConnection, DbContext } from '@db';

export abstract class BaseRepository {
  protected readonly _dbContext: DbContext;

  public constructor() {
    this._dbContext = DbConnection.getDbContext();
  }
}
