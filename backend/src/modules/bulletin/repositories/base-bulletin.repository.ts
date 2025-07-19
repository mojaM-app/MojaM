import { BaseRepository } from '@db';
import { isGuid, isPositiveNumber } from '@utils';
import { Bulletin } from '../../../dataBase/entities/bulletin/bulletin.entity';

export abstract class BaseBulletinRepository extends BaseRepository {
  public async getIdByUuid(uuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(uuid)) {
      return undefined;
    }

    const bulletin: Bulletin | null = await this._dbContext.bulletins.findOneBy({ uuid: uuid! });

    if (bulletin === null) {
      return undefined;
    }

    return bulletin.id;
  }

  public async existsByUuid(uuid: string | null | undefined): Promise<boolean> {
    if (!isGuid(uuid)) {
      return false;
    }

    const count = await this._dbContext.bulletins.countBy({ uuid: uuid! });
    return count > 0;
  }

  public async existsById(id: number | null | undefined): Promise<boolean> {
    if (!isPositiveNumber(id)) {
      return false;
    }

    const count = await this._dbContext.bulletins.countBy({ id: id! });
    return count > 0;
  }
}
