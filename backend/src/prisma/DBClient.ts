import { PrismaClient } from '@prisma/client';

class DBClient {
  public prisma: PrismaClient;
  private static instance: DBClient;
  private constructor() {
    this.prisma = new PrismaClient();
  }

  private static getInstance = () => {
    if (!DBClient.instance) {
      DBClient.instance = new DBClient();
    }
    return DBClient.instance;
  };

  public static getDbContext(): PrismaClient {
    return DBClient.getInstance().prisma;
  }
}

export default DBClient;
