import { PrismaClient } from '@prisma/client';

class DbClient {
  private static instance: DbClient;

  private readonly _prisma: PrismaClient;

  private constructor() {
    this._prisma = new PrismaClient();
  }

  private static getInstance = () => {
    if (!DbClient.instance) {
      DbClient.instance = new DbClient();
    }

    return DbClient.instance;
  };

  public static getDbContext(): PrismaClient {
    return DbClient.getInstance()._prisma;
  }
}

export default DbClient;
