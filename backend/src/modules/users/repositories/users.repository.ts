import { relatedDataNames } from '@db';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { CryptoService } from '@modules/auth';
import { BaseRepository } from '@modules/common';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  UpdateUserDto,
  UpdateUserReqDto,
} from '@modules/users';
import { isGuid, isNullOrEmptyString, isNullOrUndefined, isPositiveNumber } from '@utils';
import StatusCode from 'status-code-enum';
import Container, { Service } from 'typedi';
import { User } from './../entities/user.entity';

@Service()
export class UsersRepository extends BaseRepository {
  private readonly _cryptoService: CryptoService;

  public constructor() {
    super();
    this._cryptoService = Container.get(CryptoService);
  }

  public async getIdByUuid(userGuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(userGuid)) {
      return undefined;
    }

    const cachedUserId = await this._cacheService.getUserIdFromCacheAsync(userGuid);
    if (isPositiveNumber(cachedUserId)) {
      return cachedUserId;
    }

    const count: number = await this._dbContext.users.count({ where: { uuid: userGuid! } });

    if (count > 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.general.More_Then_One_Record_With_Same_Id, [userGuid!]);
    } else if (count === 0) {
      return undefined;
    }

    const user: User | null = await this._dbContext.users.findOneBy({ uuid: userGuid! });

    await this._cacheService.saveUserIdInCacheAsync(user);

    return user!.id;
  }

  public async getById(userId: number | null | undefined): Promise<User | null> {
    if (!isPositiveNumber(userId)) {
      return null;
    }

    const count: number = await this._dbContext.users.count({ where: { id: userId! } });

    if (count === 0) {
      return null;
    }

    return await this._dbContext.users.findOneBy({ id: userId! });
  }

  public async getByUuid(userGuid: string | null | undefined): Promise<User | null> {
    const userId = await this.getIdByUuid(userGuid);
    return await this.getById(userId);
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
    const salt = this._cryptoService.generateSalt();
    const hashedPassword = this._cryptoService.hashPassword(salt, userData.password);
    const newUser = this._dbContext.users.create({
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
    });
    return await this._dbContext.users.save(newUser);
  }

  public async checkIfCanBeDeleted(userId: number): Promise<string[]> {
    const relatedData: string[] = [];

    const count = await this._dbContext.userSystemPermissions
      .createQueryBuilder()
      .where('AssignedById = :userId', { userId })
      .andWhere('UserId != :userId', { userId })
      .getCount();

    if (count > 0) {
      relatedData.push(relatedDataNames.SystemPermission_AssignedBy);
    }

    return relatedData;
  }

  public async delete(user: User, reqDto: DeleteUserReqDto): Promise<boolean> {
    await this._dbContext.userSystemPermissions.createQueryBuilder().delete().where('userId = :userId', { userId: user.id }).execute();

    await this._dbContext.users.delete({ id: user.id });

    return true;
  }

  public async activate(userId: number, reqDto: ActivateUserReqDto): Promise<User | null> {
    const updateReqDto = new UpdateUserReqDto(
      userId,
      {
        isActive: true,
      } satisfies UpdateUserDto,
      reqDto.currentUserId,
    );

    return await this.update(updateReqDto);
  }

  public async deactivate(userId: number, reqDto: DeactivateUserReqDto): Promise<User | null> {
    const updateReqDto = new UpdateUserReqDto(
      userId,
      {
        isActive: false,
      } satisfies UpdateUserDto,
      reqDto.currentUserId,
    );

    return await this.update(updateReqDto);
  }

  public async increaseFailedLoginAttempts(reqDto: UpdateUserReqDto): Promise<number> {
    if (isNullOrUndefined(reqDto.userData.failedLoginAttempts)) {
      reqDto.userData.failedLoginAttempts = 0;
    }

    reqDto.userData.failedLoginAttempts!++;

    await this.update(reqDto);

    return reqDto.userData.failedLoginAttempts!;
  }

  public async lockOutUser(reqDto: UpdateUserReqDto): Promise<boolean> {
    reqDto.userData.isLockedOut = true;

    await this.update(reqDto);

    return reqDto.userData.isLockedOut;
  }

  private async update(reqDto: UpdateUserReqDto): Promise<User | null> {
    await this._dbContext.users.update(reqDto.userId, reqDto.userData);

    return await this._dbContext.users.findOne({ where: { id: reqDto.userId } });
  }
}
