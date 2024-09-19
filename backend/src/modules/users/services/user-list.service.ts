import { events } from '@events';
import { IGridPageResponseDto } from '@interfaces';
import { BaseService, userToIUserGridItemDto } from '@modules/common';
import {
  GetUserListReqDto,
  UserListRepository,
  UserListRetrievedEvent,
  UsersGridPageDto
} from '@modules/users';
import { Container, Service } from 'typedi';
import { User } from '../entities/user.entity';

@Service()
export class UserListService extends BaseService {
  private readonly _userListRepository: UserListRepository;

  public constructor() {
    super();
    this._userListRepository = Container.get(UserListRepository);
  }

  public async get(reqDto: GetUserListReqDto): Promise<UsersGridPageDto> {
    const usersWithTotal: IGridPageResponseDto<User> = await this._userListRepository.get(reqDto.page, reqDto.sort);

    this._eventDispatcher.dispatch(events.users.userRetrieved, new UserListRetrievedEvent(reqDto.currentUserId));

    return {
      items: usersWithTotal.items.map(user => userToIUserGridItemDto(user)),
      totalCount: usersWithTotal.totalCount
    } satisfies UsersGridPageDto;
  }
}
