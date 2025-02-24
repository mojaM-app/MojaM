import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { BaseService } from '@modules/common';
import {
  GetUserProfileReqDto,
  IGetUserProfileDto,
  UpdateUserModel,
  UpdateUserProfileDto,
  UpdateUserProfileReqDto,
  UserProfileRetrievedEvent,
  UserProfileUpdatedEvent,
  UserRepository,
} from '@modules/users';
import { isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';
import { User } from '../entities/user.entity';
import { IUpdateUser } from '../interfaces/update-user.interfaces';

@Service()
export class UserProfileService extends BaseService {
  private readonly _userRepository: UserRepository;

  public constructor() {
    super();
    this._userRepository = Container.get(UserRepository);
  }

  public async get(reqDto: GetUserProfileReqDto): Promise<IGetUserProfileDto | null> {
    const user = await this._userRepository.getById(reqDto.currentUserId);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: null });
    }

    const userDto = this.userToIGetUserProfileDto(user!);

    this._eventDispatcher.dispatch(events.users.userProfileRetrieved, new UserProfileRetrievedEvent(userDto, reqDto.currentUserId));

    return userDto;
  }

  public async update(reqDto: UpdateUserProfileReqDto): Promise<boolean> {
    const user = await this._userRepository.getById(reqDto.currentUserId);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: null });
    }

    const userData: UpdateUserProfileDto = reqDto.userData;

    const model = new UpdateUserModel(user!.id, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      joiningDate: userData.joiningDate,
    } satisfies IUpdateUser) satisfies UpdateUserModel;
    const updatedUser = await this._userRepository.update(model);

    this._eventDispatcher.dispatch(events.users.userProfileUpdated, new UserProfileUpdatedEvent(updatedUser!, reqDto.currentUserId));

    return true;
  }

  private userToIGetUserProfileDto(user: User): IGetUserProfileDto {
    return {
      email: user.email,
      phone: user.phone,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      joiningDate: user.joiningDate ?? null,
    };
  }
}
