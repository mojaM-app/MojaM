import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { Announcement } from '../modules/announcements/entities/announcement.entity';
import { UserResetPasswordToken } from '../modules/auth/entities/user-reset-password-tokens.entity';
import { SystemPermission } from '../modules/permissions/entities/system-permission.entity';
import { UserSystemPermission } from '../modules/users/entities/user-system-permission.entity';
import { User } from '../modules/users/entities/user.entity';
import { vUser } from '../modules/users/entities/vUser.entity';

export class DbContext extends DataSource {
  public get vUsers(): Repository<vUser> {
    return this.getRepository(vUser);
  }

  public get users(): Repository<User> {
    return this.getRepository(User);
  }

  public get userSystemPermissions(): Repository<UserSystemPermission> {
    return this.getRepository(UserSystemPermission);
  }

  public get systemPermissions(): Repository<SystemPermission> {
    return this.getRepository(SystemPermission);
  }

  public get userResetPasswordTokens(): Repository<UserResetPasswordToken> {
    return this.getRepository(UserResetPasswordToken);
  }

  public get announcements(): Repository<Announcement> {
    return this.getRepository(Announcement);
  }

  public constructor(options: DataSourceOptions) {
    super(options);
  }
}
