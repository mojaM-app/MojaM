import { BaseService, events } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { isNullOrUndefined } from '@utils';
import { Service } from 'typedi';
import { GetUserDetailsReqDto, IUserDetailsDto } from '../dtos/get-user-details.dto';
import { UserDetailsRetrievedEvent } from '../events/user-details-retrieved-event';
import { vUserRepository } from '../repositories/user-details.repository';
import { vUser } from './../../../dataBase/entities/users/vUser.entity';

@Service()
export class UsersDetailsService extends BaseService {
  constructor(private readonly _repository: vUserRepository) {
    super();
  }

  public async get(reqDto: GetUserDetailsReqDto): Promise<IUserDetailsDto | null> {
    const user = await this._repository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new BadRequestException(errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    const userDetails = this.vUserToIUserDetailsDto(user!);

    this._eventDispatcher.dispatch(events.users.userDetailsRetrieved, new UserDetailsRetrievedEvent(userDetails, reqDto.currentUserId));

    return userDetails;
  }

  private vUserToIUserDetailsDto(user: vUser): IUserDetailsDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      joiningDate: user.joiningDate,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      isLockedOut: user.isLockedOut,
      permissionCount: user.permissionCount,
    } satisfies IUserDetailsDto;
  }
}
