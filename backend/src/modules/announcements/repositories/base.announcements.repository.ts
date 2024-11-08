import { BaseRepository } from '@modules/common';
import { isGuid, isPositiveNumber } from '@utils';
import Container from 'typedi';
import { Announcement } from '../entities/announcement.entity';
import { AnnouncementsCacheService } from '../services/announcements-cache.service';

export abstract class BaseAnnouncementsRepository extends BaseRepository {
  private readonly _cacheService: AnnouncementsCacheService;

  public constructor() {
    super();
    this._cacheService = Container.get(AnnouncementsCacheService);
  }

  public async getIdByUuid(uuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(uuid)) {
      return undefined;
    }

    const idFromCache = await this._cacheService.getIdFromCacheAsync(uuid);
    if (isPositiveNumber(idFromCache)) {
      return idFromCache;
    }

    const announcement: Announcement | null = await this._dbContext.announcements.findOneBy({ uuid: uuid! });

    if (announcement === null) {
      return undefined;
    }

    await this._cacheService.saveIdInCacheAsync(announcement);

    return announcement.id;
  }
}