import 'reflect-metadata';
import { DbContext } from './dbContext';
import { TitleCaseNamingStrategy } from './pascal-naming.strategy';
import { DATABASE_HOST, DATABASE_MIGRATIONS_PATH, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_USERNAME } from '../config/index';
import { AnnouncementItem } from '../modules/announcements/entities/announcement-item.entity';
import { Announcement } from '../modules/announcements/entities/announcement.entity';
import { vAnnouncement } from '../modules/announcements/entities/vAnnouncement.entity';
import { UserResetPasscodeToken } from '../modules/auth/entities/user-reset-passcode-tokens.entity';
import { SystemPermission } from '../modules/permissions/entities/system-permission.entity';
import { UserSystemPermission } from '../modules/users/entities/user-system-permission.entity';
import { User } from '../modules/users/entities/user.entity';
import { vUser } from '../modules/users/entities/vUser.entity';
import { toNumber } from '../utils/numbers.utils';

export const AppDataSource = new DbContext({
  type: 'mysql',
  host: DATABASE_HOST,
  port: toNumber(DATABASE_PORT)!,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  synchronize: false,
  logging: true,
  entities: [User, SystemPermission, UserSystemPermission, UserResetPasscodeToken, vUser, Announcement, AnnouncementItem, vAnnouncement],
  subscribers: [],
  namingStrategy: new TitleCaseNamingStrategy(),
  migrationsTableName: '_migrations_history',
  migrationsTransactionMode: 'each',
  metadataTableName: '_typeorm_metadata',
  migrations: [DATABASE_MIGRATIONS_PATH!],
  dateStrings: ['DATE'],

  // Connection pool settings
  poolSize: 10, // Maximum number of connections in the pool
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
