import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import { BaseService } from '@modules/common/base.service';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { User } from '@prisma/client';

import { Guid } from 'guid-typescript';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class UserService extends BaseService {
  private readonly _userRepository: UserRepository | undefined = undefined;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
  }

  // public async findAllUser(): Promise<IUser[]> {
  //   const allUser: IUser[] = await this.users.findMany();
  //   return allUser;
  // }

  public async get(userGuid: Guid): Promise<User> {
    const user: User = await this._userRepository.getByUuid(userGuid);

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.create.User_Does_Not_Exist, [userGuid.toString()]);
    }

    return user;
  }

  public async create(userData: CreateUserDto): Promise<User> {
    const userExists = await this._userRepository.checkIfExists({ email: userData.email, phone: userData.phone });

    if (userExists) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.create.User_Already_Exists, [
        userData.email,
        userData.phone,
      ]);
    }

    return await this._userRepository.create(userData);
  }

  // public async updateUser(userId: number, userData: UpdateUserDto): Promise<IUser> {
  //   const findUser: IUser = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   const hashedPassword = await hash(userData.password, 10);
  //   const updateUserData = await this.users.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
  //   return updateUserData;
  // }

  public async delete(userGuid: Guid): Promise<string> {
    const user: User = await this._userRepository.getByUuid(userGuid);

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.create.User_Does_Not_Exist, [userGuid.toString()]);
    }

    const relatedData: Array<string> = await this._userRepository.checkIfCanBeDeleted(user.id);

    if (relatedData.length > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        error_keys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        [userGuid.toString()].concat(relatedData),
      );
    }

    const deletedUser = await this._userRepository.delete(user.id);

    return deletedUser.uuid;
  }
}
