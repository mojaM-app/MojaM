import { BaseRepository } from '@db';
import { Service } from 'typedi';
import { vUser } from '../../../dataBase/entities/users/vUser.entity';

@Service()
export class vUserRepository extends BaseRepository {
  constructor() {
    super();
  }

  public async getByUuid(uuid: string | null | undefined): Promise<vUser | null> {
    return await this._dbContext.vUsers.findOneBy({ id: uuid ?? undefined });
  }
}
