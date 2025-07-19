import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import { AnnouncementItem } from './entities/announcements/announcement-item.entity';
import { Announcement } from './entities/announcements/announcement.entity';
import { vAnnouncement } from './entities/announcements/vAnnouncement.entity';
import { BulletinDayTask } from './entities/bulletin/bulletin-day-task.entity';
import { BulletinDay } from './entities/bulletin/bulletin-day.entity';
import { BulletinQuestionAnswer } from './entities/bulletin/bulletin-question-answer.entity';
import { BulletinQuestion } from './entities/bulletin/bulletin-question.entity';
import { Bulletin } from './entities/bulletin/bulletin.entity';
import { UserBulletinProgress } from './entities/bulletin/user-bulletin-progress.entity';
import { UserTaskProgress } from './entities/bulletin/user-task-progress.entity';
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

  // Bulletin repositories
  public get bulletins(): Repository<Bulletin> {
    return this.getRepository(Bulletin);
  }

  public get bulletinDays(): Repository<BulletinDay> {
    return this.getRepository(BulletinDay);
  }

  public get bulletinDayTasks(): Repository<BulletinDayTask> {
    return this.getRepository(BulletinDayTask);
  }

  public get bulletinQuestions(): Repository<BulletinQuestion> {
    return this.getRepository(BulletinQuestion);
  }

  public get bulletinQuestionAnswers(): Repository<BulletinQuestionAnswer> {
    return this.getRepository(BulletinQuestionAnswer);
  }

  public get userBulletinProgress(): Repository<UserBulletinProgress> {
    return this.getRepository(UserBulletinProgress);
  }

  public get userTaskProgress(): Repository<UserTaskProgress> {
    return this.getRepository(UserTaskProgress);
  }

  constructor(options: DataSourceOptions) {
    super(options);
  }
}
