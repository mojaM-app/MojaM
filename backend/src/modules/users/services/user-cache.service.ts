import { CacheService } from '@core';
import { Service } from 'typedi';
import { User } from '../../../dataBase/entities/users/user.entity';

@Service()
export class UserCacheService extends CacheService<User> {
  constructor() {
    super();
  }

  protected override getEntityName(): string {
    return User.typeName;
  }
}
