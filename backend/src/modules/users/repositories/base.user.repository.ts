import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { BaseRepository } from '@modules/common';
import { isGuid, isPositiveNumber } from '@utils';
import StatusCode from 'status-code-enum';
import { Service } from 'typedi';
import { User } from '../entities/user.entity';

@Service()
export abstract class BaseUserRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async getIdByUuid(userGuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(userGuid)) {
      return undefined;
    }

    const cachedUserId = await this._cacheService.getUserIdFromCacheAsync(userGuid);
    if (isPositiveNumber(cachedUserId)) {
      return cachedUserId;
    }

    const count: number = await this._dbContext.users.count({ where: { uuid: userGuid! } });

    if (count > 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.general.More_Then_One_Record_With_Same_Id, [userGuid!]);
    } else if (count === 0) {
      return undefined;
    }

    const user: User | null = await this._dbContext.users.findOneBy({ uuid: userGuid! });

    await this._cacheService.saveUserIdInCacheAsync(user);

    return user!.id;
  }

  public async getById(userId: number | null | undefined): Promise<User | null> {
    if (!isPositiveNumber(userId)) {
      return null;
    }

    const count: number = await this._dbContext.users.count({ where: { id: userId! } });

    if (count === 0) {
      return null;
    }

    return await this._dbContext.users.findOneBy({ id: userId! });
  }

  public async getByUuid(userGuid: string | null | undefined): Promise<User | null> {
    const userId = await this.getIdByUuid(userGuid);
    return await this.getById(userId);
  }
}
