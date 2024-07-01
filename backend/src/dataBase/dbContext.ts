import { SystemPermission } from '@modules/permissions/entities/system-permission.entity';
import { UserSystemPermission } from '@modules/users/entities/user-system-permission.entity';
import { User } from '@modules/users/entities/user.entity';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';

export class DbContext extends DataSource {
  public get users(): Repository<User> {
    return this.getRepository(User);
  }

  public get userSystemPermissions(): Repository<UserSystemPermission> {
    return this.getRepository(UserSystemPermission);
  }

  public get systemPermissions(): Repository<SystemPermission> {
    return this.getRepository(SystemPermission);
  }

  public constructor(options: DataSourceOptions) {
    super(options);
  }
}
