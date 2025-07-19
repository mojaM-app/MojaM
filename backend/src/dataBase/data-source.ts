import 'reflect-metadata';
import { toNumber } from './../utils/numbers.utils';
import { DbContext } from './dbContext';
import { TitleCaseNamingStrategy } from './title-case-naming.strategy';
import {
  DATABASE_HOST,
  DATABASE_MIGRATIONS_PATH,
  DATABASE_NAME,
  DATABASE_PASSWORD,
  DATABASE_PORT,
  DATABASE_USERNAME,
  NODE_ENV,
} from '../config';
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
import { SystemPermission } from './entities/permissions/system-permission.entity';
import { UserResetPasscodeToken } from './entities/users/user-reset-passcode-tokens.entity';
import { UserSystemPermission } from './entities/users/user-system-permission.entity';
import { User } from './entities/users/user.entity';
import { vUser } from './entities/users/vUser.entity';

export const AppDataSource = new DbContext({
  type: 'mysql',
  host: DATABASE_HOST,
  port: toNumber(DATABASE_PORT)!,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  synchronize: false,
  logging: NODE_ENV !== 'production',
  entities: [
    User,
    SystemPermission,
    UserSystemPermission,
    UserResetPasscodeToken,
    vUser,
    Announcement,
    AnnouncementItem,
    vAnnouncement,
    Bulletin,
    BulletinDay,
    BulletinDayTask,
    BulletinQuestion,
    BulletinQuestionAnswer,
    UserBulletinProgress,
    UserTaskProgress,
    Log,
    vLog,
  ],
  subscribers: [],
  namingStrategy: new TitleCaseNamingStrategy(),
  migrationsTableName: '_migrations_history',
  migrationsTransactionMode: 'each',
  metadataTableName: '_typeorm_metadata',
  migrations: [DATABASE_MIGRATIONS_PATH!],
  dateStrings: ['DATE'],

  // Connection pool settings
  poolSize: NODE_ENV !== 'production' ? 10 : 5, // Maximum number of connections in the pool
  connectTimeout: 15000, // Connection timeout in ms (15 seconds)

  // Maximum query execution time in milliseconds
  maxQueryExecutionTime: 10000, // 10 seconds

  // Extra connection options
  extra: {
    // Idle timeout
    idleTimeout: 60000,
    // Wait for connections to close before stopping the server
    waitForConnections: true,
    // Maximum query size
    maxPreparedStatements: 250,
    // Connection stability - automatic reconnect
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000,
  },
});
