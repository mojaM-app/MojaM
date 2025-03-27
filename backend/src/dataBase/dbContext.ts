import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { AnnouncementItem } from '../modules/announcements/entities/announcement-item.entity';
import { Announcement } from '../modules/announcements/entities/announcement.entity';
import { vAnnouncement } from '../modules/announcements/entities/vAnnouncement.entity';
import { UserResetPasscodeToken } from '../modules/auth/entities/user-reset-passcode-tokens.entity';
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

  public get userResetPasscodeTokens(): Repository<UserResetPasscodeToken> {
    return this.getRepository(UserResetPasscodeToken);
  }

  public get announcements(): Repository<Announcement> {
    return this.getRepository(Announcement);
  }

  public get announcementItems(): Repository<AnnouncementItem> {
    return this.getRepository(AnnouncementItem);
  }

  public get vAnnouncements(): Repository<vAnnouncement> {
    return this.getRepository(vAnnouncement);
  }

  public constructor(options: DataSourceOptions) {
    super(options);
  }
}
