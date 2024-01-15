import { User } from '@db/DbModels';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { BaseService } from '@modules/common';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  GetUserProfileReqDto,
  UsersRepository,
} from '@modules/users';
import { isGuid, isNullOrEmptyString, isNullOrUndefined } from '@utils';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class UsersService extends BaseService {
  private readonly _userRepository: UsersRepository;

  public constructor() {
    super();
    this._userRepository = Container.get(UsersRepository);
  }

  public async get(reqDto: GetUserProfileReqDto): Promise<User | null> {
    if (!isGuid(reqDto.userGuid)) {
      return null;
    }

    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    return user;
  }

  public async create(reqDto: CreateUserReqDto): Promise<User> {
    const userData: CreateUserDto = reqDto.userData;

    if (isNullOrEmptyString(userData?.email) || isNullOrEmptyString(userData?.phone)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Email_Or_Phone);
    }

    const userExists = await this._userRepository.checkIfExists({ email: userData.email!, phone: userData.phone! });

    if (userExists) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Already_Exists, [userData.email!, userData.phone!]);
    }

    if (isNullOrEmptyString(userData?.password)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.Invalid_Password);
    }

    return await this._userRepository.create(reqDto);
  }

  // public async updateUser(userId: number, userData: UpdateUserDto): Promise<IUser> {
  //   const findUser: IUser = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   const hashedPassword = await hash(userData.password, 10);
  //   const updateUserData = await this.users.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
  //   return updateUserData;
  // }

  public async delete(reqDto: DeleteUserReqDto): Promise<string | null> {
    if (!isGuid(reqDto.userGuid)) {
      return null;
    }

    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    const relatedData: string[] = await this._userRepository.checkIfCanBeDeleted(user!.id);

    if (relatedData.length > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        [user!.uuid].concat(relatedData),
      );
    }

    const deletedUser = await this._userRepository.delete(user!, reqDto);

    return isNullOrUndefined(deletedUser) ? null : deletedUser!.uuid;
  }

  public async activate(reqDto: ActivateUserReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid)) {
      return false;
    }

    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    const activatedUser = await this._userRepository.activate(user!.id, reqDto);

    return !isNullOrUndefined(activatedUser);
  }

  public async deactivate(reqDto: DeactivateUserReqDto): Promise<boolean> {
    if (!isGuid(reqDto.userGuid)) {
      return false;
    }

    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, [reqDto.userGuid!]);
    }

    const deactivatedUser = await this._userRepository.deactivate(user!.id, reqDto);

    return !isNullOrUndefined(deactivatedUser);
  }
}
