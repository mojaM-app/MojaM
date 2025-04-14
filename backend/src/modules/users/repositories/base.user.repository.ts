import { BaseRepository } from '@modules/common';
import { isGuid, isPositiveNumber } from '@utils';
import Container from 'typedi';
import { User } from '../entities/user.entity';
import { UserCacheService } from '../services/user-cache.service';

export abstract class BaseUserRepository extends BaseRepository {
  protected readonly _cacheService: UserCacheService;

  constructor() {
    super();
    this._cacheService = Container.get(UserCacheService);
  }

  public async getIdByUuid(uuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(uuid)) {
      return undefined;
    }

    const idFromCache = await this._cacheService.getIdFromCacheAsync(uuid);
    if (isPositiveNumber(idFromCache)) {
      return idFromCache;
    }

    const user: User | null = await this._dbContext.users.findOneBy({ uuid: uuid! });

    if (user === null) {
      return undefined;
    }

    await this._cacheService.saveIdInCacheAsync(user);

    return user.id;
  }

  public async getById(id: number | null | undefined): Promise<User | null> {
    if (!isPositiveNumber(id)) {
      return null;
    }

    return await this._dbContext.users.findOneBy({ id: id! });
  }

  public async getByUuid(uuid: string | null | undefined): Promise<User | null> {
    const id = await this.getIdByUuid(uuid);
    return await this.getById(id);
  }
}
