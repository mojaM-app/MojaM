import { relatedDataNames } from '@db';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { CryptoService, PasswordService } from '@modules/auth';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  UpdateUserDto,
  UpdateUserPasswordDto,
  UpdateUserReqDto,
} from '@modules/users';
import { getDateTimeNow, isNullOrEmptyString, isNullOrUndefined } from '@utils';
import StatusCode from 'status-code-enum';
import Container, { Service } from 'typedi';
import { User } from '../entities/user.entity';
import { ICreateUser } from '../interfaces/create-user.interfaces';
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
    } satisfies ICreateUser);

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

    if (isNullOrUndefined(reqDto.userData.failedLoginAttempts)) {
      reqDto.userData.failedLoginAttempts = 0;
    }

    reqDto.userData.failedLoginAttempts++;

    await this.update(reqDto);

    return reqDto.userData.failedLoginAttempts;
  }

  public async lockOut(userId: number): Promise<boolean> {
    const reqDto = {
      userId,
      userData: {
        isLockedOut: true,
      } satisfies UpdateUserDto,
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
      } satisfies UpdateUserDto,
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
      } satisfies UpdateUserPasswordDto,
      currentUserId: undefined,
    } satisfies UpdateUserReqDto;

    await this.update(reqDto);
  }

  private async update(reqDto: UpdateUserReqDto): Promise<User | null> {
    await this._dbContext.users.update(reqDto.userId, reqDto.userData);

    return await this._dbContext.users.findOne({ where: { id: reqDto.userId } });
  }
}
