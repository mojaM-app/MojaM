import { User } from '@db/DbModels';
import { error_keys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { BaseRepository } from '@modules/common';
import { ActivateUserPayload, CreateUserDto, CreateUserPayload, DeleteUserPayload, UpdateUserDto, UpdateUserPayload } from '@modules/users';
import { hash } from 'bcrypt';
import { isEmail } from 'class-validator';
import { Guid } from 'guid-typescript';
import StatusCode from 'status-code-enum';
import { Service } from 'typedi';

@Service()
export class UsersRepository extends BaseRepository {
  public constructor() {
    super();
  }

  public async getIdByUuid(userGuid: Guid): Promise<number | null> {
    const uuid = userGuid?.toString();

    if (!uuid?.length) {
      return null;
    }

    const cachedUserId = await this._cacheService.getUserIdFromCacheAsync(uuid);
    if (cachedUserId) {
      return cachedUserId;
    }

    const count: number = await this._dbContext.user.count({ where: { uuid: uuid } });

    if (count > 1) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.general.More_Then_One_Record_With_Same_Id, [
        userGuid.toString(),
      ]);
    } else if (count === 0) {
      return null;
    }

    const user: User = await this._dbContext.user.findUnique({ where: { uuid: uuid } });

    await this._cacheService.saveUserIdInCacheAsync(user);

    return user.id;
  }

  public async getById(userId: number): Promise<User | null> {
    if (!userId) {
      return null;
    }

    const count: number = await this._dbContext.user.count({ where: { id: userId } });

    if (count === 0) {
      return null;
    }

    return await this._dbContext.user.findUnique({ where: { id: userId } });
  }

  public async getByUuid(userGuid: Guid): Promise<User | null> {
    const userId: number | null = await this.getIdByUuid(userGuid);

    return await this.getById(userId);
  }

  public async findManyByLogin(login: string): Promise<User[]> {
    let users: User[];

    if (isEmail(login)) {
      users = await this._dbContext.user.findMany({ where: { email: login } });
    } else {
      users = await this._dbContext.user.findMany({ where: { phone: login } });
    }

    return users;
  }

  public async checkIfExists(user: { email: string; phone: string }): Promise<boolean> {
    const existedUser: User = await this._dbContext.user.findUnique({
      where: { email_phone: { email: user.email, phone: user.phone } },
    });

    return !!existedUser;
  }

  public async create(payload: CreateUserPayload): Promise<User> {
    const userData: CreateUserDto = payload.userData;
    const hashedPassword = await hash(userData.password, 10);
    const newUser: User = await this._dbContext.user.create({ data: { ...userData, password: hashedPassword } });
    return newUser;
  }

  public async checkIfCanBeDeleted(userId: number): Promise<string[]> {
    const relatedData: string[] = [];

    if ((await this._dbContext.userSystemPermission.count({ where: { assignedById: userId } })) > 0) {
      relatedData.push('SystemPermission_AssignedBy');
    }

    return relatedData;
  }

  public async delete(payload: DeleteUserPayload): Promise<User> {
    const deletedUser = await this._dbContext.user.delete({ where: { id: payload.userId } });

    return deletedUser;
  }

  public async activate(payload: ActivateUserPayload): Promise<User> {
    const updatePayload = new UpdateUserPayload(
      payload.userId,
      <UpdateUserDto>{
        isActive: true,
      },
      payload.currentUserId,
    );

    return await this.update(updatePayload);
  }

  public async deactivate(payload: ActivateUserPayload): Promise<User> {
    const updatePayload = new UpdateUserPayload(
      payload.userId,
      <UpdateUserDto>{
        isActive: false,
      },
      payload.currentUserId,
    );

    return await this.update(updatePayload);
  }

  public async update(payload: UpdateUserPayload): Promise<User> {
    const updatedUser: User = await this._dbContext.user.update({
      where: { id: payload.userId },
      data: payload.userData,
    });

    return updatedUser;
  }
}
