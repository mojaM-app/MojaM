import { ICreateUser, ICryptoService, IPasscodeService, IUpdateUser, IUpdateUserPasscode } from '@core';
import { relatedDataNames } from '@db';
import { BadRequestException, errorKeys } from '@exceptions';
import { getDateTimeNow, isNullOrEmptyString, normalizeEmail, normalizePhone } from '@utils';
import { Container, Service } from 'typedi';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { Repository } from 'typeorm/repository/Repository';
import { BaseUserRepository } from './base.user.repository';
import { UserResetPasscodeToken } from '../../../dataBase/entities/users/user-reset-passcode-tokens.entity';
import { UserSystemPermission } from '../../../dataBase/entities/users/user-system-permission.entity';
import { User } from '../../../dataBase/entities/users/user.entity';
import { CreateUserReqDto } from '../dtos/create-user.dto';
import { DeleteUserReqDto } from '../dtos/delete-user.dto';
import { UpdateUserModel } from '../models/update-user.model';
import { UserCacheService } from '../services/user-cache.service';

@Service()
export class UserRepository extends BaseUserRepository {
  private readonly _passcodeService: IPasscodeService;
  private readonly _cryptoService: ICryptoService;

  constructor(cacheService: UserCacheService) {
    super(cacheService);

    this._passcodeService = Container.get<IPasscodeService>('IPasscodeService');
    this._cryptoService = Container.get<ICryptoService>('ICryptoService');
  }

  public async findManyByLogin(email: string | null | undefined, phone?: string | null | undefined): Promise<User[]> {
    if (isNullOrEmptyString(email)) {
      return [];
    }

    const normEmail = normalizeEmail(email);
    const normPhone = normalizePhone(phone);

    let users: User[];
    if ((normPhone?.length ?? 0) > 0) {
      users = await this._dbContext.users.findBy({ email: normEmail!, phone: normPhone! });
    } else {
      users = await this._dbContext.users.findBy({ email: normEmail! });
    }

    return users;
  }

  public async checkIfExists(
    user: { email?: string; phone?: string } | null | undefined,
    skippedUserId?: number,
  ): Promise<boolean> {
    const email = normalizeEmail(user?.email ?? null);
    const phone = normalizePhone(user?.phone);

    if ((email?.length ?? 0) === 0 && (phone?.length ?? 0) === 0) {
      throw new BadRequestException(errorKeys.users.Invalid_Email_Or_Phone);
    }

    if ((email?.length ?? 0) > 0 && (phone?.length ?? 0) > 0) {
      const count = await this.countUsersByEmailPhonePair(this._dbContext.users, email!, phone!, skippedUserId);
      return count > 0;
    }

    // If only one of the fields is provided, by the business rule we should not block creation/update
    // because uniqueness is defined on the pair. Treat as no conflict.
    return false;
  }

  public async create(reqDto: CreateUserReqDto): Promise<User> {
    const { userData } = reqDto;

    const salt = this._cryptoService.generateSalt();
    const hashedPasscode = isNullOrEmptyString(userData.passcode)
      ? null
      : this._passcodeService.getHash(salt, userData.passcode);
    const model = {
      email: normalizeEmail(userData.email)!,
      phone: normalizePhone(userData.phone)!,
      firstName: userData.firstName,
      lastName: userData.lastName,
      joiningDate: userData.joiningDate,
      passcode: hashedPasscode,
      isActive: false,
      salt,
      refreshTokenKey: this._cryptoService.generateUserRefreshTokenKey(),
      isLockedOut: false,
      emailConfirmed: false,
      phoneConfirmed: false,
      lastLoginAt: undefined,
      failedLoginAttempts: 0,
    } satisfies ICreateUser;

    const entity = this._dbContext.users.create(model);

    try {
      return await this._dbContext.users.save(entity);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error, 'UQ_User_Email_Phone')) {
        throw new BadRequestException(errorKeys.users.User_Already_Exists, {
          email: model.email,
          phone: model.phone,
        });
      }
      throw error;
    }
  }

  public async update(model: UpdateUserModel): Promise<User | null> {
    return await this._update(model);
  }

  public async checkIfCanBeDeleted(userId: number): Promise<string[]> {
    const { sql, params } = this.getCheckRelatedDataSqlAndParams(userId);
    const relatedDataConnectedWithUser = await this._dbContext.query(sql, params);

    return this.mapRelatedDataRows(relatedDataConnectedWithUser);
  }

  public async delete(userId: number, reqDto: DeleteUserReqDto): Promise<boolean> {
    await this._dbContext.transaction(async transactionalEntityManager => {
      const uspRepo = transactionalEntityManager.getRepository(UserSystemPermission);
      await uspRepo.createQueryBuilder().delete().where('userId = :userId', { userId }).execute();

      const resetTokensRepo = transactionalEntityManager.getRepository(UserResetPasscodeToken);
      await resetTokensRepo.createQueryBuilder().delete().where('userId = :userId', { userId }).execute();

      const userRepo = transactionalEntityManager.getRepository(User);
      await userRepo.delete({ id: userId });
    });

    // Clear cache after successful commit
    await this._cacheService.removeIdFromCacheAsync(reqDto.userGuid);

    return true;
  }

  public async activate(userId: number): Promise<User | null> {
    const model = new UpdateUserModel(userId, {
      isActive: true,
    } satisfies IUpdateUser);

    return await this._update(model);
  }

  public async deactivate(userId: number): Promise<User | null> {
    const model = new UpdateUserModel(userId, {
      isActive: false,
    } satisfies IUpdateUser) satisfies UpdateUserModel;

    return await this._update(model);
  }

  public async increaseFailedLoginAttempts(userId: number, currentFailedLoginAttempts: number): Promise<number> {
    const model = {
      userId,
      userData: {
        failedLoginAttempts: currentFailedLoginAttempts + 1,
      },
    } satisfies UpdateUserModel;

    const user = await this._update(model);

    return user!.failedLoginAttempts;
  }

  public async lockOut(userId: number): Promise<User | null> {
    const model = {
      userId,
      userData: {
        isLockedOut: true,
      } satisfies IUpdateUser,
    } satisfies UpdateUserModel;

    return await this._update(model);
  }

  public async unlock(userId: number): Promise<User | null> {
    const model = {
      userId,
      userData: {
        isLockedOut: false,
        failedLoginAttempts: 0,
      } satisfies IUpdateUser,
    } satisfies UpdateUserModel;

    return await this._update(model);
  }

  public async updateAfterLogin(userId: number): Promise<void> {
    const model = {
      userId,
      userData: {
        lastLoginAt: getDateTimeNow(),
        failedLoginAttempts: 0,
      } satisfies IUpdateUser,
    } satisfies UpdateUserModel;

    await this._update(model);
  }

  public async setPasscode(userId: number, passcode: string): Promise<void> {
    const salt = this._cryptoService.generateSalt();
    const hashedPasscode = this._passcodeService.getHash(salt, passcode);

    const model = {
      userId,
      userData: {
        passcode: hashedPasscode!,
        salt,
        emailConfirmed: true,
        failedLoginAttempts: 0,
      } satisfies IUpdateUserPasscode,
    } satisfies UpdateUserModel;

    await this._update(model);
  }

  private async _update(model: UpdateUserModel): Promise<User | null> {
    const updates: IUpdateUser = { ...model.userData };

    if (typeof updates.email === 'string') {
      const normalized = normalizeEmail(updates.email);
      if (normalized !== null) {
        updates.email = normalized;
      }
    }
    if (typeof updates.phone === 'string') {
      const normalized = normalizePhone(updates.phone);
      if (normalized !== null) {
        updates.phone = normalized;
      }
    }

    try {
      await this._dbContext.users.update(model.userId, updates);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error, 'UQ_User_Email_Phone')) {
        throw new BadRequestException(errorKeys.users.User_Already_Exists, {
          email: updates.email,
          phone: updates.phone,
        });
      }
      throw error;
    }

    return await this._dbContext.users
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: model.userId })
      .getOne();
  }

  private buildEmailPhonePairFilter(
    qb: SelectQueryBuilder<User>,
    alias: string,
    email: string,
    phone: string,
  ): SelectQueryBuilder<User> {
    return qb.andWhere(`(${alias}.email = :email AND ${alias}.phone = :phone)`, { email, phone });
  }

  private async countUsersByEmailPhonePair(
    repo: Repository<User>,
    email: string,
    phone: string,
    skippedUserId?: number,
  ): Promise<number> {
    const queryBuilder = repo.createQueryBuilder('u');
    if ((skippedUserId ?? 0) > 0) {
      queryBuilder.andWhere('u.id <> :skippedUserId', { skippedUserId });
    }
    this.buildEmailPhonePairFilter(queryBuilder, 'u', email, phone);
    return await queryBuilder.getCount();
  }

  private getCheckRelatedDataSqlAndParams(userId: number): { sql: string; params: Array<string | number> } {
    const sql = `SELECT COUNT(*) AS count, ? as entities
        FROM user_to_systempermissions uts
        WHERE uts.AssignedById = ? AND uts.UserId != ?
      UNION
      SELECT COUNT(*) AS count, ? as entities
        FROM announcements an_cr
        WHERE an_cr.CreatedById = ?
      UNION
      SELECT COUNT(*) AS count, ? as entities
      FROM announcements an_pub
        WHERE an_pub.PublishedById = ?
      UNION
        SELECT COUNT(*) AS count, ? as entities
        FROM announcement_items ani_cr
        WHERE ani_cr.CreatedById = ?
      UNION
        SELECT COUNT(*) AS count, ? as entities
        FROM announcement_items ani_up
        WHERE ani_up.UpdatedById = ?`;

    const params = [
      relatedDataNames.SystemPermission_AssignedBy,
      userId,
      userId,
      relatedDataNames.Announcements_CreatedBy,
      userId,
      relatedDataNames.Announcements_PublishedBy,
      userId,
      relatedDataNames.AnnouncementItems_CreatedBy,
      userId,
      relatedDataNames.AnnouncementItems_UpdatedBy,
      userId,
    ];

    return { sql, params };
  }
}
