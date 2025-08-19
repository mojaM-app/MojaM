import { CacheService } from '@core';
import { Service } from 'typedi';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';

@Service()
export class BulletinCacheService extends CacheService<Bulletin> {
  constructor() {
    super();
  }

  protected override getEntityName(): string {
    return Bulletin.typeName;
  }
}
