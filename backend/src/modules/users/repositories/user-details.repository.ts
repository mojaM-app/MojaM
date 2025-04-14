import { BaseRepository } from '@modules/common';
import { Service } from 'typedi';
import { vUser } from '../entities/vUser.entity';

@Service()
export class vUserRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async getByUuid(uuid: string | null | undefined): Promise<vUser | null> {
    return await this._dbContext.vUsers.findOneBy({ id: uuid ?? undefined });
  }
}
