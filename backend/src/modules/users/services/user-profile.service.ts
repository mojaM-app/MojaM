import { BaseService, events, IUpdateUser } from '@core';
import { Service } from 'typedi';
import { User } from '../../../dataBase/entities/users/user.entity';
import { GetUserProfileReqDto, IGetUserProfileDto } from '../dtos/get-user-profile.dto';
import { UpdateUserProfileReqDto } from '../dtos/update-user-profile.dto';
import { UserProfileRetrievedEvent } from '../events/user-profile-retrieved-event';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated-event';
import { UpdateUserModel } from '../models/update-user.model';
import { UserRepository } from '../repositories/user.repository';

@Service()
export class UserProfileService extends BaseService {
  constructor(private readonly _userRepository: UserRepository) {
    super();
  }

  public async get(reqDto: GetUserProfileReqDto): Promise<IGetUserProfileDto | null> {
    const user = await this._userRepository.getById(reqDto.currentUserId);

    const userDto = this.userToIGetUserProfileDto(user!);

    this._eventDispatcher.dispatch(
      events.users.userProfileRetrieved,
      new UserProfileRetrievedEvent(userDto, reqDto.currentUserId),
    );

    return userDto;
  }

  public async update(reqDto: UpdateUserProfileReqDto): Promise<boolean> {
    const user = await this._userRepository.getById(reqDto.currentUserId);

    const { userData } = reqDto;

    const model = new UpdateUserModel(user!.id, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      joiningDate: userData.joiningDate,
    } satisfies IUpdateUser) satisfies UpdateUserModel;
    const updatedUser = await this._userRepository.update(model);

    this._eventDispatcher.dispatch(
      events.users.userProfileUpdated,
      new UserProfileUpdatedEvent(updatedUser!, reqDto.currentUserId),
    );

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
