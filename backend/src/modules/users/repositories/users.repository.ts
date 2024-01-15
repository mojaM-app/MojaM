import { User } from '@db/DbModels';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { BaseRepository } from '@modules/common';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  UpdateUserDto,
  UpdateUserReqDto
} from '@modules/users';
import { isGuid, isNullOrEmptyString, isNullOrUndefined, isPositiveNumber } from '@utils';
import { hash } from 'bcrypt';
import { isEmail } from 'class-validator';
import StatusCode from 'status-code-enum';
import { Service } from 'typedi';

@Service()
export class UsersRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async getIdByUuid(userGuid: string | null | undefined): Promise<number | undefined> {
    if (!isGuid(userGuid)) {
      return undefined;
    }

    const cachedUserId = await this._cacheService.getUserIdFromCacheAsync(userGuid);
    if (isPositiveNumber(cachedUserId)) {
      return cachedUserId;
    }

    const count: number = await this._dbContext.user.count({ where: { uuid: userGuid! } });

    if (count > 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.general.More_Then_One_Record_With_Same_Id, [userGuid!]);
    } else if (count === 0) {
      return undefined;
    }

    const user: User | null = await this._dbContext.user.findUnique({ where: { uuid: userGuid! } });

    if (isNullOrUndefined(user)) {
      return undefined;
    }

    await this._cacheService.saveUserIdInCacheAsync(user!);

    return user!.id;
  }

  public async getById(userId: number | undefined | null): Promise<User | null> {
    if (!isPositiveNumber(userId)) {
      return null;
    }

    const count: number = await this._dbContext.user.count({ where: { id: userId! } });

    if (count === 0) {
      return null;
    }

    return await this._dbContext.user.findUnique({ where: { id: userId! } });
  }

  public async getByUuid(userGuid: string | null | undefined): Promise<User | null> {
    const userId = await this.getIdByUuid(userGuid);
    return await this.getById(userId);
  }

  public async findManyByLogin(login: string | undefined | null): Promise<User[]> {
    if (isNullOrEmptyString(login)) {
      return [];
    }

    let users: User[];
    if (isEmail(login)) {
      users = await this._dbContext.user.findMany({ where: { email: login! } });
    } else {
      users = await this._dbContext.user.findMany({ where: { phone: login! } });
    }

    return users;
  }

  public async checkIfExists(user: { email: string; phone: string } | null | undefined): Promise<boolean> {
    if (isNullOrEmptyString(user?.email) || isNullOrEmptyString(user?.phone)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Email_Or_Phone);
    }

    const count: number = await this._dbContext.user.count({
      where: { email: user!.email, phone: user!.phone },
    });

    return count > 0;
  }

  public async create(reqDto: CreateUserReqDto): Promise<User> {
    const userData: CreateUserDto = reqDto.userData;
    const hashedPassword = await hash(userData.password, 10);
    return await this._dbContext.user.create({ data: { ...userData, password: hashedPassword } });
  }

  public async checkIfCanBeDeleted(userId: number): Promise<string[]> {
    const relatedData: string[] = [];

    if ((await this._dbContext.userSystemPermission.count({ where: { assignedById: userId } })) > 0) {
      relatedData.push('SystemPermission_AssignedBy');
    }

    return relatedData;
  }

  public async delete(user: User, reqDto: DeleteUserReqDto): Promise<User | null> {
    const deletedUser = await this._dbContext.user.delete({ where: { id: user.id } });

    return deletedUser;
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

  private async update(reqDto: UpdateUserReqDto): Promise<User | null> {
    const updatedUser: User = await this._dbContext.user.update({
      where: { id: reqDto.userId },
      data: reqDto.userData,
    });

    return updatedUser;
  }
}
