import { ICreateUser, IUpdateUser, IUpdateUserPasscode } from '@core';
import { relatedDataNames } from '@db';
import { BadRequestException, errorKeys } from '@exceptions';
import { CryptoService, PasscodeService, ResetPasscodeTokensRepository } from '@modules/auth';
import { CreateUserDto, CreateUserReqDto, DeleteUserReqDto, UpdateUserModel } from '@modules/users';
import { getDateTimeNow, isNullOrEmptyString } from '@utils';
import Container, { Service } from 'typedi';
import { Not } from 'typeorm';
import { User } from './../../../dataBase/entities/users/user.entity';
import { BaseUserRepository } from './base.user.repository';

@Service()
export class UserRepository extends BaseUserRepository {
  private readonly _cryptoService: CryptoService;
  private readonly _passcodeService: PasscodeService;
  private readonly _resetPasscodeTokensRepository: ResetPasscodeTokensRepository;

  constructor() {
    super();
    this._cryptoService = Container.get(CryptoService);
    this._passcodeService = Container.get(PasscodeService);
    this._resetPasscodeTokensRepository = Container.get(ResetPasscodeTokensRepository);
  }

  public async findManyByLogin(email: string | null | undefined, phone?: string | null | undefined): Promise<User[]> {
    if (isNullOrEmptyString(email)) {
      return [];
    }

    let users: User[];
    if ((phone?.length ?? 0) > 0) {
      users = await this._dbContext.users.findBy({ email: email!, phone: phone! });
    } else {
      users = await this._dbContext.users.findBy({ email: email! });
    }

    return users;
  }

  public async checkIfExists(user: { email: string; phone: string } | null | undefined, skippedUserId?: number): Promise<boolean> {
    if (isNullOrEmptyString(user?.email) || isNullOrEmptyString(user?.phone)) {
      throw new BadRequestException(errorKeys.users.Invalid_Email_Or_Phone);
    }

    const count: number = await this._dbContext.users.count({
      where: {
        id: Not(skippedUserId ?? 0),
        email: user!.email,
        phone: user!.phone,
      },
    });

    return count > 0;
  }

  public async create(reqDto: CreateUserReqDto): Promise<User> {
    const userData: CreateUserDto = reqDto.userData;

    const salt = this._cryptoService.generateSalt();
    const hashedPasscode = this._passcodeService.getHash(salt, userData.passcode);
    const model = {
      email: userData.email,
      phone: userData.phone,
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

    return await this._dbContext.users.save(entity);
  }

  public async update(model: UpdateUserModel): Promise<User | null> {
    return await this._update(model);
  }

  public async checkIfCanBeDeleted(userId: number): Promise<string[]> {
    const relatedDataConnectedWithUser = await this._dbContext.query(
      `SELECT COUNT(*) AS count, '${relatedDataNames.SystemPermission_AssignedBy}' as entities
        FROM user_to_systempermissions uts
        WHERE uts.AssignedById = ${userId} AND uts.UserId != ${userId}
      UNION
      SELECT COUNT(*) AS count, '${relatedDataNames.Announcements_CreatedBy}' as entities
        FROM announcements an_cr
        WHERE an_cr.CreatedById = ${userId}
      UNION
      SELECT COUNT(*) AS count, '${relatedDataNames.Announcements_PublishedBy}' as entities
      FROM announcements an_pub
        WHERE an_pub.PublishedById = ${userId}
      UNION
        SELECT COUNT(*) AS count, '${relatedDataNames.AnnouncementItems_CreatedBy}' as entities
        FROM announcement_items ani_cr
        WHERE ani_cr.CreatedById = ${userId}
      UNION
        SELECT COUNT(*) AS count, '${relatedDataNames.AnnouncementItems_UpdatedBy}' as entities
        FROM announcement_items ani_up
        WHERE ani_up.UpdatedById = ${userId}
      `,
      [userId],
    );

    return relatedDataConnectedWithUser
      .map((x: { count: string; entities: string }) => {
        return {
          count: parseInt(x.count),
          entities: x.entities,
        };
      })
      .filter((x: { count: number; entities: string }) => x.count > 0)
      .map((x: { count: number; entities: string }) => x.entities);
  }

  public async delete(userId: number, reqDto: DeleteUserReqDto): Promise<boolean> {
    await this._dbContext.userSystemPermissions.createQueryBuilder().delete().where('userId = :userId', { userId }).execute();
    await this._resetPasscodeTokensRepository.deleteTokens(userId);

    await this._dbContext.users.delete({ id: userId });

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
    await this._dbContext.users.update(model.userId, model.userData);

    return await this._dbContext.users.createQueryBuilder('user').where('user.id = :userId', { userId: model.userId }).getOne();
  }
}
