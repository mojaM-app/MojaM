import { User } from '@db/DbModels';
import { error_keys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { BaseService } from '@modules/common';
import {
  ActivateUserPayload,
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserPayload,
  DeactivateUserPayload,
  DeactivateUserReqDto,
  DeleteUserPayload,
  DeleteUserReqDto,
  UsersRepository
} from '@modules/users';
import { Guid } from 'guid-typescript';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class UsersService extends BaseService {
  private readonly _userRepository: UsersRepository | undefined = undefined;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
  }

  // public async findAllUser(): Promise<IUser[]> {
  //   const allUser: IUser[] = await this.users.findMany();
  //   return allUser;
  // }

  public async get(userGuid: Guid): Promise<User> {
    const user: User = await this._userRepository.getByUuid(userGuid);

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.User_Does_Not_Exist, [userGuid.toString()]);
    }

    return user;
  }

  public async create(payload: CreateUserPayload): Promise<User> {
    const userData: CreateUserDto = payload.userData;
    const userExists = await this._userRepository.checkIfExists({ email: userData.email, phone: userData.phone });

    if (userExists) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.User_Already_Exists, [userData.email, userData.phone]);
    }

    return await this._userRepository.create(payload);
  }

  // public async updateUser(userId: number, userData: UpdateUserDto): Promise<IUser> {
  //   const findUser: IUser = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   const hashedPassword = await hash(userData.password, 10);
  //   const updateUserData = await this.users.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
  //   return updateUserData;
  // }

  public async delete(reqDto: DeleteUserReqDto): Promise<string> {
    const user: User = await this._userRepository.getByUuid(reqDto.userGuid);

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.User_Does_Not_Exist, [reqDto.userGuid.toString()]);
    }

    const relatedData: string[] = await this._userRepository.checkIfCanBeDeleted(user.id);

    if (relatedData.length > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        error_keys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        [reqDto.userGuid.toString()].concat(relatedData)
      );
    }

    const deletedUser = await this._userRepository.delete(new DeleteUserPayload(user.id, reqDto));

    return deletedUser.uuid;
  }

  public async activate(reqDto: ActivateUserReqDto): Promise<boolean> {
    const user: User = await this._userRepository.getByUuid(reqDto.userGuid);

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.User_Does_Not_Exist, [reqDto.userGuid.toString()]);
    }

    const activatedUser = await this._userRepository.activate(new ActivateUserPayload(user.id, reqDto));

    return !!activatedUser;
  }

  public async deactivate(reqDto: DeactivateUserReqDto): Promise<boolean> {
    const user: User = await this._userRepository.getByUuid(reqDto.userGuid);

    if (!user) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, error_keys.users.User_Does_Not_Exist, [reqDto.userGuid.toString()]);
    }

    const deactivatedUser = await this._userRepository.deactivate(new DeactivateUserPayload(user.id, reqDto));

    return !!deactivatedUser;
  }
}
