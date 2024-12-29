import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { ResetPasswordTokensRepository } from '@modules/auth/repositories/reset-password-tokens.repository';
import { BaseService, userToIUser } from '@modules/common';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  IUserDto,
  UserActivatedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserRepository,
  UserRetrievedEvent,
} from '@modules/users';
import { isNullOrUndefined } from '@utils';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';
import { GetUserReqDto } from '../dtos/get-user.dto';
import { User } from '../entities/user.entity';
import { IGetUserDto } from '../interfaces/get-user.interfaces';

@Service()
export class UsersService extends BaseService {
  private readonly _userRepository: UserRepository;
  private readonly _resetPasswordTokensRepository: ResetPasswordTokensRepository;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
    this._resetPasswordTokensRepository = Container.get(ResetPasswordTokensRepository);
  }

  public async get(reqDto: GetUserReqDto): Promise<IGetUserDto | null> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    const userDto = this.userToIGetUserDto(user!);

    this._eventDispatcher.dispatch(events.users.userRetrieved, new UserRetrievedEvent(userDto, reqDto.currentUserId));

    return userDto;
  }

  public async create(reqDto: CreateUserReqDto): Promise<IUserDto> {
    const userData: CreateUserDto = reqDto.userData;

    const userExists = await this._userRepository.checkIfExists({ email: userData?.email, phone: userData?.phone });

    if (userExists) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Already_Exists, {
        email: userData.email,
        phone: userData.phone,
      });
    }

    const user = await this._userRepository.create(reqDto);
    const userDto = userToIUser(user);
    this._eventDispatcher.dispatch(events.users.userCreated, new UserCreatedEvent(userDto, reqDto.currentUserId));

    return userDto;
  }

  // public async updateUser(userId: number, userData: UpdateUserDto): Promise<IUserDto> {
  //   const findUser: IUserDto = await this.users.findUnique({ where: { id: userId } });
  //   if (!findUser) throw new HttpException(409, "User doesn't exist");

  //   const hashedPassword = await hash(userData.password, 10);
  //   const updateUserData = await this.users.update({ where: { id: userId }, data: { ...userData, password: hashedPassword } });
  //   return updateUserData;
  // }

  public async delete(reqDto: DeleteUserReqDto): Promise<string | null> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    const relatedData: string[] = await this._userRepository.checkIfCanBeDeleted(user!.id);

    if (relatedData.length > 0) {
      throw new TranslatableHttpException(
        StatusCode.ClientErrorBadRequest,
        errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted,
        {
          id: user?.uuid,
          relatedData,
        },
      );
    }

    await this._resetPasswordTokensRepository.deleteTokens(user!.id);
    await this._userRepository.delete(user!, reqDto);

    this._eventDispatcher.dispatch(events.users.userDeleted, new UserDeletedEvent(userToIUser(user!), reqDto.currentUserId));

    return user!.uuid;
  }

  public async activate(reqDto: ActivateUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    if (user!.isActive) {
      return true;
    }

    const activatedUser = await this._userRepository.activate(user!.id, reqDto);

    this._eventDispatcher.dispatch(events.users.userActivated, new UserActivatedEvent(userToIUser(activatedUser!), reqDto.currentUserId));

    return activatedUser!.isActive;
  }

  public async deactivate(reqDto: DeactivateUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    if (!user!.isActive) {
      return true;
    }

    const deactivatedUser = await this._userRepository.deactivate(user!.id, reqDto);

    this._eventDispatcher.dispatch(events.users.userDeactivated, new UserDeactivatedEvent(userToIUser(deactivatedUser!), reqDto.currentUserId));

    return !deactivatedUser!.isActive;
  }

  private userToIGetUserDto(user: User): IGetUserDto {
    return {
      id: user.uuid,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      joiningDate: user.joiningDate ?? null,
    };
  }
}
