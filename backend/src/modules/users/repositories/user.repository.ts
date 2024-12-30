import { relatedDataNames } from '@db';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { CryptoService, PasswordService } from '@modules/auth';
import { ActivateUserReqDto, CreateUserDto, CreateUserReqDto, DeactivateUserReqDto, DeleteUserReqDto, UpdateUserReqDto } from '@modules/users';
import { getDateTimeNow, isNullOrEmptyString } from '@utils';
import StatusCode from 'status-code-enum';
import Container, { Service } from 'typedi';
import { User } from '../entities/user.entity';
import { ICreateUser } from '../interfaces/create-user.interfaces';
import { IUpdateUser, IUpdateUserPassword } from '../interfaces/update-user.interfaces';
import { BaseUserRepository } from './base.user.repository';

@Service()
export class UserRepository extends BaseUserRepository {
  private readonly _cryptoService: CryptoService;
  private readonly _passwordService: PasswordService;

  public constructor() {
    super();
    this._cryptoService = Container.get(CryptoService);
    this._passwordService = Container.get(PasswordService);
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

  public async checkIfExists(user: { email: string; phone: string } | null | undefined): Promise<boolean> {
    if (isNullOrEmptyString(user?.email) || isNullOrEmptyString(user?.phone)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Email_Or_Phone);
    }

    const count: number = await this._dbContext.users.count({
      where: { email: user!.email, phone: user!.phone },
    });

    return count > 0;
  }

  public async create(reqDto: CreateUserReqDto): Promise<User> {
    const userData: CreateUserDto = reqDto.userData;
    if ((userData.password?.length ?? 0) > 0 && !this._passwordService.isPasswordValid(userData.password!)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Password);
    }

    const salt = this._cryptoService.generateSalt();
    const hashedPassword = (userData.password?.length ?? 0) > 0 ? this._passwordService.hashPassword(salt, userData.password!) : null;
    const model = {
      ...userData,
      password: hashedPassword,
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

  public async delete(user: User, reqDto: DeleteUserReqDto): Promise<boolean> {
    await this._dbContext.userSystemPermissions.createQueryBuilder().delete().where('userId = :userId', { userId: user.id }).execute();

    await this._dbContext.users.delete({ id: user.id });

    await this._cacheService.removeIdFromCacheAsync(user.uuid);

    return true;
  }

  public async activate(userId: number, reqDto: ActivateUserReqDto): Promise<User | null> {
    const updateReqDto = new UpdateUserReqDto(
      userId,
      {
        isActive: true,
      } satisfies IUpdateUser,
      reqDto.currentUserId,
    );

    return await this.update(updateReqDto);
  }

  public async deactivate(userId: number, reqDto: DeactivateUserReqDto): Promise<User | null> {
    const updateReqDto = new UpdateUserReqDto(
      userId,
      {
        isActive: false,
      } satisfies IUpdateUser,
      reqDto.currentUserId,
    ) satisfies UpdateUserReqDto;

    return await this.update(updateReqDto);
  }

  public async increaseFailedLoginAttempts(userId: number, currentFailedLoginAttempts: number): Promise<number> {
    const reqDto = {
      userId,
      userData: {
        failedLoginAttempts: currentFailedLoginAttempts,
      },
      currentUserId: undefined,
    } satisfies UpdateUserReqDto;

    reqDto.userData.failedLoginAttempts++;

    const user = await this.update(reqDto);

    return user?.failedLoginAttempts ?? 0;
  }

  public async lockOut(userId: number): Promise<boolean> {
    const reqDto = {
      userId,
      userData: {
        isLockedOut: true,
      } satisfies IUpdateUser,
      currentUserId: undefined,
    } satisfies UpdateUserReqDto;

    await this.update(reqDto);

    return reqDto.userData.isLockedOut;
  }

  public async updateAfterLogin(userId: number): Promise<void> {
    const reqDto = {
      userId,
      userData: {
        lastLoginAt: getDateTimeNow(),
        failedLoginAttempts: 0,
      } satisfies IUpdateUser,
      currentUserId: undefined,
    } satisfies UpdateUserReqDto;

    await this.update(reqDto);
  }

  public async setPassword(userId: number, password: string): Promise<void> {
    const salt = this._cryptoService.generateSalt();
    const hashedPassword = this._passwordService.hashPassword(salt, password);

    const reqDto = {
      userId,
      userData: {
        password: hashedPassword,
        salt,
        emailConfirmed: true,
        failedLoginAttempts: 0,
      } satisfies IUpdateUserPassword,
      currentUserId: undefined,
    } satisfies UpdateUserReqDto;

    await this.update(reqDto);
  }

  private async update(reqDto: UpdateUserReqDto): Promise<User | null> {
    await this._dbContext.users.update(reqDto.userId, reqDto.userData);

    return await this._dbContext.users.findOne({ where: { id: reqDto.userId } });
  }
}
