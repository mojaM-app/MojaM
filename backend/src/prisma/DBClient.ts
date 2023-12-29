import { PrismaClient } from '@prisma/client';

class DBClient {
  private static instance: DBClient;

  private readonly _prisma: PrismaClient;

  private constructor() {
    this._prisma = new PrismaClient();
  }

  private static getInstance = () => {
    if (!DBClient.instance) {
      DBClient.instance = new DBClient();
    }

    return DBClient.instance;
  };

  public static getDbContext(): PrismaClient {
    return DBClient.getInstance()._prisma;
  }
}

export default DBClient;
