import { events } from '@events';
import { BadRequestException, ConflictException, errorKeys } from '@exceptions';
import { BaseService, userToIUser } from '@modules/common';
import {
  ActivateUserReqDto,
  CreateUserDto,
  CreateUserReqDto,
  DeactivateUserReqDto,
  DeleteUserReqDto,
  GetUserReqDto,
  IGetUserDto,
  IUserDto,
  UnlockUserReqDto,
  UpdateUserDto,
  UpdateUserModel,
  UpdateUserReqDto,
  UserActivatedEvent,
  UserCreatedEvent,
  UserDeactivatedEvent,
  UserDeletedEvent,
  UserRepository,
  UserRetrievedEvent,
  UserUnlockedEvent,
  UserUpdatedEvent,
} from '@modules/users';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';
import { User } from '../entities/user.entity';
import { IUpdateUser } from '../interfaces/update-user.interfaces';

@Service()
export class UsersService extends BaseService {
  private readonly _userRepository: UserRepository;

  constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
  }

  public async get(reqDto: GetUserReqDto): Promise<IGetUserDto | null> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    const userDto = this.userToIGetUserDto(user!);

    this._eventDispatcher.dispatch(events.users.userRetrieved, new UserRetrievedEvent(userDto, reqDto.currentUserId));

    return userDto;
  }

  public async create(reqDto: CreateUserReqDto): Promise<IUserDto> {
    const userData: CreateUserDto = reqDto.userData;

    const userExists = await this._userRepository.checkIfExists({ email: userData.email, phone: userData.phone });

    if (userExists) {
      throw new BadRequestException(errorKeys.users.User_Already_Exists, {
        email: userData.email,
        phone: userData.phone,
      });
    }

    const user = await this._userRepository.create(reqDto);
    this._eventDispatcher.dispatch(events.users.userCreated, new UserCreatedEvent(user, reqDto.currentUserId));

    return userToIUser(user);
  }

  public async update(reqDto: UpdateUserReqDto): Promise<IUserDto> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    const userData: UpdateUserDto = reqDto.userData;

    let newEmail = userData.email;
    if (newEmail !== undefined && isNullOrEmptyString(newEmail)) {
      throw new BadRequestException(errorKeys.users.Invalid_Email, {
        email: newEmail,
      });
    }
    let newPhone = userData.phone;
    if (newPhone !== undefined && isNullOrEmptyString(newPhone)) {
      throw new BadRequestException(errorKeys.users.Invalid_Phone, {
        phone: newPhone,
      });
    }

    if (newEmail === undefined) {
      newEmail = user!.email;
    }
    if (newPhone === undefined) {
      newPhone = user!.phone;
    }
    if (newEmail !== user!.email || newPhone !== user!.phone) {
      const userExists = await this._userRepository.checkIfExists({ email: newEmail, phone: newPhone }, user!.id);

      if (userExists) {
        throw new BadRequestException(errorKeys.users.User_Already_Exists, {
          email: newEmail,
          phone: newPhone,
        });
      }
    }

    const model = new UpdateUserModel(user!.id, {
      email: userData.email,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      joiningDate: userData.joiningDate,
    } satisfies IUpdateUser) satisfies UpdateUserModel;
    const updatedUser = await this._userRepository.update(model);

    this._eventDispatcher.dispatch(events.users.userUpdated, new UserUpdatedEvent(updatedUser!, reqDto.currentUserId));

    return userToIUser(updatedUser!);
  }

  public async delete(reqDto: DeleteUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    const relatedData: string[] = await this._userRepository.checkIfCanBeDeleted(user!.id);

    if (relatedData.length > 0) {
      throw new ConflictException(errorKeys.general.Object_Is_Connected_With_Another_And_Can_Not_Be_Deleted, {
        id: user!.uuid,
        relatedData,
      });
    }

    const result = await this._userRepository.delete(user!.id, reqDto);

    this._eventDispatcher.dispatch(events.users.userDeleted, new UserDeletedEvent(user!, reqDto.currentUserId));

    return result;
  }

  public async activate(reqDto: ActivateUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    if (user!.isActive) {
      return true;
    }

    if (!user!.isPasscodeSet()) {
      throw new BadRequestException(errorKeys.users.Activation_Failed_Passcode_Is_Not_Set);
    }

    const activatedUser = await this._userRepository.activate(user!.id);

    this._eventDispatcher.dispatch(events.users.userActivated, new UserActivatedEvent(activatedUser!, reqDto.currentUserId));

    return activatedUser!.isActive;
  }

  public async deactivate(reqDto: DeactivateUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    if (!user!.isActive) {
      return true;
    }

    const deactivatedUser = await this._userRepository.deactivate(user!.id);

    this._eventDispatcher.dispatch(events.users.userDeactivated, new UserDeactivatedEvent(deactivatedUser!, reqDto.currentUserId));

    return !deactivatedUser!.isActive;
  }

  public async unlock(reqDto: UnlockUserReqDto): Promise<boolean> {
    const user = await this._userRepository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    if (!user!.isLockedOut) {
      return true;
    }

    const unlockedUser = await this._userRepository.unlock(user!.id);

    this._eventDispatcher.dispatch(events.users.userUnlocked, new UserUnlockedEvent(unlockedUser!, reqDto.currentUserId));

    return !unlockedUser!.isLockedOut;
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
