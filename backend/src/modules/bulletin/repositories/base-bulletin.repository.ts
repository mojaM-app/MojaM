import { BaseRepository } from '@db';
import { isGuid } from '@utils';
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
}
