import { AppDataSource } from './data-source';
import { DbContext } from './dbContext';

export class DbConnection {
  // eslint-disable-next-line no-use-before-define
  private static instance: DbConnection | null = null;

  private readonly _dataContext: DbContext | null = null;

  private constructor() {
    this._dataContext = AppDataSource;
  }

  public static getConnection(): DbConnection {
    if (DbConnection.instance === null) {
      DbConnection.instance = new DbConnection();
    }

    return DbConnection.instance;
  }

  public async connect(): Promise<void> {
    if ((DbConnection.instance?._dataContext ?? null) !== null && !DbConnection.instance!._dataContext!.isInitialized) {
      await DbConnection.instance!._dataContext!.initialize();
    }
  }

  public async close(): Promise<void> {
    if ((DbConnection.instance?._dataContext ?? null) !== null && DbConnection.instance!._dataContext!.isInitialized) {
      await DbConnection.instance!._dataContext!.destroy();
    }
  }

  public static getDbContext(): DbContext {
    const connection = DbConnection.getConnection();
    const dbContext = connection._dataContext;
    if (dbContext === null) {
      throw new Error('Database connection not initialized');
    }
    return connection._dataContext!;
  }
}
