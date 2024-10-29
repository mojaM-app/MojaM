import { CacheService } from '@modules/common';
import { Service } from 'typedi';
import { User } from '../entities/user.entity';

@Service()
export class UserCacheService extends CacheService<User> {
  public constructor() {
    super();
  }

  protected override getEntityType(): string {
    return User.name;
  }
}
