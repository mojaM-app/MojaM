import { AppDataSource } from './data-source';
import { DbConnection, IDbConnection } from './dbConnection';
import { DbContext } from './dbContext';

export class DbConnectionManager {
  private static instance: IDbConnection | null = null;

  public static getConnection(): IDbConnection {
    if (DbConnectionManager.instance === null) {
      DbConnectionManager.instance = new DbConnection(AppDataSource);
    }

    return DbConnectionManager.instance;
  }

  public static getDbContext(): DbContext {
    const connection = DbConnectionManager.getConnection();
    return connection.getDbContext();
  }

  public static setConnectionForTesting(connection: IDbConnection): void {
    DbConnectionManager.instance = connection;
  }

  public static reset(): void {
    DbConnectionManager.instance = null;
  }

  public static async gracefulShutdown(): Promise<void> {
    if (DbConnectionManager.instance) {
      await DbConnectionManager.instance.gracefulShutdown();
      DbConnectionManager.reset();
    }
  }
}
