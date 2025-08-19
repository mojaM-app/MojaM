import { Container } from 'typedi';
import { BaseRepository } from '@db';
import { isGuid, isPositiveNumber } from '@utils';
import { type Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';
import { BulletinCacheService } from '../services/bulletin-cache.service';

export abstract class BaseBulletinRepository extends BaseRepository {
  protected readonly _cacheService: BulletinCacheService;

  constructor() {
    super();
    this._cacheService = Container.get(BulletinCacheService);
  }

  public async getIdByUuid(uuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(uuid)) {
      return undefined;
    }

    const idFromCache = await this._cacheService.getIdFromCacheAsync(uuid);
    if (isPositiveNumber(idFromCache)) {
      return idFromCache;
    }

    const bulletin: Bulletin | null = await this._dbContext.bulletins.findOneBy({ uuid: uuid! });

    if (bulletin === null) {
      return undefined;
    }

    await this._cacheService.saveIdInCacheAsync(bulletin);

    return bulletin.id;
  }
}
