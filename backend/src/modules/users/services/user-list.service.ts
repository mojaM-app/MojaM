import { events } from '@events';
import { IGridPageResponseDto } from '@interfaces';
import { BaseService, vUserToIUserGridItemDto } from '@modules/common';
import {
  GetUserListReqDto,
  UserListRepository,
  UserListRetrievedEvent,
  UsersGridPageDto
} from '@modules/users';
import { Container, Service } from 'typedi';
import { vUser } from '../entities/vUser.entity';

@Service()
export class UserListService extends BaseService {
  private readonly _userListRepository: UserListRepository;

  public constructor() {
    super();
    this._userListRepository = Container.get(UserListRepository);
  }

  public async get(reqDto: GetUserListReqDto): Promise<UsersGridPageDto> {
    const usersWithTotal: IGridPageResponseDto<vUser> = await this._userListRepository.get(reqDto.page, reqDto.sort);

    this._eventDispatcher.dispatch(events.users.userListRetrieved, new UserListRetrievedEvent(reqDto.currentUserId));

    return {
      items: usersWithTotal.items.map(user => vUserToIUserGridItemDto(user)),
      totalCount: usersWithTotal.totalCount
    } satisfies UsersGridPageDto;
  }
}
