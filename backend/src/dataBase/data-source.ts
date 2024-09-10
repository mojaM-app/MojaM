import 'reflect-metadata';
import { UserResetPasswordToken } from '../modules/auth/entities/user-reset-password-tokens.entity';
import { SystemPermission } from '../modules/permissions/entities/system-permission.entity';
import { UserSystemPermission } from '../modules/users/entities/user-system-permission.entity';
import { User } from '../modules/users/entities/user.entity';
import { DbContext } from './dbContext';
import { TitleCaseNamingStrategy } from './pascal-naming.strategy';

export const AppDataSource = new DbContext({
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'admin',
  database: 'dev',
  synchronize: false,
  logging: true,
  entities: [User, SystemPermission, UserSystemPermission, UserResetPasswordToken],
  subscribers: [],
  namingStrategy: new TitleCaseNamingStrategy(),
  migrationsTableName: '_migrations_history',
  migrations: ['src/dataBase/migrations/*{.ts,.js}'],
});
