import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { error_keys } from '@exceptions/error.keys';
import { BaseService } from '@modules/common/base.service';
import { CreateUserDto } from '@modules/users/dtos/create-user.dto';
import { User } from '@prisma/client';
import { hash } from 'bcrypt';
import { Guid } from 'guid-typescript';
import StatusCode from 'status-code-enum';
import { Service } from 'typedi';

@Service()
export class UserService extends BaseService {
  // public async findAllUser(): Promise<IUser[]> {
  //   const allUser: IUser[] = await this.users.findMany();
  //   return allUser;
  // }

  public async get(userGuid: Guid): Promise<User> {
    const userId = await this.getUserId(userGuid);
    const user: User = await this._dbContext.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.create.User_Does_Not_Exist, [userGuid.toString()]);
    }

    return user;
  }

  public async create(userData: CreateUserDto): Promise<User> {
    const existedUser: User = await this._dbContext.user.findUnique({ where: { email_phone: { email: userData.email, phone: userData.phone } } });

    if (existedUser) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.create.User_Already_Exists, [
        userData.email,
        userData.phone,
      ]);
    }

    const hashedPassword = await hash(userData.password, 10);
    const newUser: User = await this._dbContext.user.create({ data: { ...userData, password: hashedPassword } });
    return newUser;
  }

  // public async updateUser(userId: number, userData: UpdateUserDto): Promise<IUser> {
  //   const findUser: IUser = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   const hashedPassword = await hash(userData.password, 10);
  //   const updateUserData = await this.users.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
  //   return updateUserData;
  // }

  public async delete(userGuid: Guid): Promise<string> {
    const userId = await this.getUserId(userGuid);

    if (!userId) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.create.User_Does_Not_Exist, [userGuid.toString()]);
    }

    const user: User = await this._dbContext.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.create.User_Does_Not_Exist, [userGuid.toString()]);
    }

    if ((await this._dbContext.userSystemPermission.count({ where: { assignedById: userId } })) > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        error_keys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        [userGuid.toString()],
      );
    }

    const deleteUserData = await this._dbContext.user.delete({ where: { id: userId } });

    return deleteUserData.uuid;
  }
}
