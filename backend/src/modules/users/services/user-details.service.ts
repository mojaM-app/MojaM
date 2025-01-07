import { events } from '@events';
import { BadRequestException, errorKeys } from '@exceptions';
import { BaseService } from '@modules/common';
import { GetUserDetailsReqDto, IUserDetailsDto, UserDetailsRetrievedEvent, vUserRepository } from '@modules/users';
import { isNullOrUndefined } from '@utils';
import { Container, Service } from 'typedi';
import { vUser } from '../entities/vUser.entity';

@Service()
export class UsersDetailsService extends BaseService {
  private readonly _repository: vUserRepository;

  public constructor() {
    super();
    this._repository = Container.get(vUserRepository);
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
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      joiningDate: user.joiningDate ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      isActive: user.isActive,
      isLockedOut: user.isLockedOut,
      permissionCount: user.permissionCount,
    } satisfies IUserDetailsDto;
  }
}
