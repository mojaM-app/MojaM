import { events } from '@events';
import { IGridPageResponseDto } from '@interfaces';
import { BaseService } from '@modules/common';
import { GetUserListReqDto, UserListRepository, UserListRetrievedEvent, UsersGridPageDto, vUserToIUserGridItemDto } from '@modules/users';
import { Container, Service } from 'typedi';
import { vUser } from '../entities/vUser.entity';

@Service()
export class UserListService extends BaseService {
  private readonly _repository: UserListRepository;

  public constructor() {
    super();
    this._repository = Container.get(UserListRepository);
  }

  public async get(reqDto: GetUserListReqDto): Promise<UsersGridPageDto> {
    const recordsWithTotal: IGridPageResponseDto<vUser> = await this._repository.get(reqDto.page, reqDto.sort);

    this._eventDispatcher.dispatch(events.users.userListRetrieved, new UserListRetrievedEvent(reqDto.currentUserId));

    return {
      items: recordsWithTotal.items.map(user => vUserToIUserGridItemDto(user)),
      totalCount: recordsWithTotal.totalCount,
    } satisfies UsersGridPageDto;
  }
}
