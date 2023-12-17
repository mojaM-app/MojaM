import DBClient from '@db/DBClient';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import { PrismaClient, User } from '@prisma/client';
import { Guid } from 'guid-typescript';
import StatusCode from 'status-code-enum';

export class BaseService {
  protected readonly _dbContext: PrismaClient;

  constructor() {
    this._dbContext = DBClient.getDbContext();
  }

  protected async getUserId(userGuid: Guid): Promise<number | null> {
    const uuid = userGuid.toString();
    const count: number = await this._dbContext.user.count({ where: { uuid: uuid } });

    if (count > 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.general.More_Then_One_Record_With_Same_Id, [
        userGuid.toString(),
      ]);
    } else if (count === 0) {
      return null;
    }

    const user: User = await this._dbContext.user.findUnique({ where: { uuid: uuid } });
    return user.id;
  }
}
