import 'reflect-metadata';
import { DATABASE_HOST, DATABASE_MIGRATIONS_PATH, DATABASE_NAME, DATABASE_PASSWORD, DATABASE_PORT, DATABASE_USERNAME } from '../config/index';
import { UserResetPasswordToken } from '../modules/auth/entities/user-reset-password-tokens.entity';
import { SystemPermission } from '../modules/permissions/entities/system-permission.entity';
import { UserSystemPermission } from '../modules/users/entities/user-system-permission.entity';
import { User } from '../modules/users/entities/user.entity';
import { vUser } from '../modules/users/entities/vUser.entity';
import { toNumber } from '../utils/numbers.utils';
import { DbContext } from './dbContext';
import { TitleCaseNamingStrategy } from './pascal-naming.strategy';

export const AppDataSource = new DbContext({
  type: 'mysql',
  host: DATABASE_HOST,
  port: toNumber(DATABASE_PORT)!,
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  synchronize: false,
  logging: true,
  entities: [User, SystemPermission, UserSystemPermission, UserResetPasswordToken, vUser],
  subscribers: [],
  namingStrategy: new TitleCaseNamingStrategy(),
  migrationsTableName: '_migrations_history',
  migrationsTransactionMode: 'all',
  migrations: [DATABASE_MIGRATIONS_PATH!],
});
