import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { AnnouncementItem } from './entities/announcements/announcement-item.entity';
import { Announcement } from './entities/announcements/announcement.entity';
import { vAnnouncement } from './entities/announcements/vAnnouncement.entity';
import { Bulletin } from './entities/bulletin/bulletin.entity';
import { vBulletin } from './entities/bulletin/vBulletin.entity';
import { Log } from './entities/logs/log.entity';
import { vLog } from './entities/logs/vLog.entity';
import { UserResetPasscodeToken } from './entities/users/user-reset-passcode-tokens.entity';
import { UserSystemPermission } from './entities/users/user-system-permission.entity';
import { User } from './entities/users/user.entity';
import { vUser } from './entities/users/vUser.entity';

export class DbContext extends DataSource {
  public get logs(): Repository<Log> {
    return this.getRepository(Log);
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

  public get vLogs(): Repository<vLog> {
    return this.getRepository(vLog);
  }

  public get vUsers(): Repository<vUser> {
    return this.getRepository(vUser);
  }

  public get vAnnouncements(): Repository<vAnnouncement> {
    return this.getRepository(vAnnouncement);
  }

  public get vBulletins(): Repository<vBulletin> {
    return this.getRepository(vBulletin);
  }

  public get bulletins(): Repository<Bulletin> {
    return this.getRepository(Bulletin);
  }

  constructor(options: DataSourceOptions) {
    super(options);
  }
}
