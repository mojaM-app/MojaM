import { BaseService, events, IGridPageResponseDto, IUserGridItemDto } from '@core';
import { Service } from 'typedi';
import { vUser } from '../../../dataBase/entities/users/vUser.entity';
import { GetUserListReqDto, TUsersGridPageDto } from '../dtos/get-user-list.dto';
import { UserListRetrievedEvent } from '../events/user-list-retrieved-event';
import { UserListRepository } from '../repositories/user-list.repository';

@Service()
export class UserListService extends BaseService {
  constructor(private readonly _repository: UserListRepository) {
    super();
  }

  public async get(reqDto: GetUserListReqDto): Promise<TUsersGridPageDto> {
    const recordsWithTotal: IGridPageResponseDto<vUser> = await this._repository.get(reqDto.page, reqDto.sort);

    this._eventDispatcher.dispatch(events.users.userListRetrieved, new UserListRetrievedEvent(reqDto.currentUserId));

    return {
      items: recordsWithTotal.items.map(entity => this.vUserToIUserGridItemDto(entity)),
      totalCount: recordsWithTotal.totalCount,
    } satisfies TUsersGridPageDto;
  }

  private vUserToIUserGridItemDto(user: vUser): IUserGridItemDto {
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
    } satisfies IUserGridItemDto;
  }
}
