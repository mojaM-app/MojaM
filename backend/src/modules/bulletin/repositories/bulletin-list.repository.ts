import { Service } from 'typedi';
import { BaseBulletinRepository } from './base-bulletin.repository';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';

@Service()
export class BulletinListRepository extends BaseBulletinRepository {
  constructor() {
    super();
  }

  public async get(skip: number = 0, take: number = 50): Promise<Bulletin[]> {
    return await this._dbContext.bulletins.find({
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }
}
