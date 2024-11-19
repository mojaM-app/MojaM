import { events } from '@events';
import { errorKeys } from '@exceptions';
import { TranslatableHttpException } from '@exceptions/TranslatableHttpException';
import { BaseService, userToIUserProfile } from '@modules/common';
import { GetUserProfileReqDto, IUserProfileDto, UserProfileRepository, UserProfileRetrievedEvent } from '@modules/users';
import { isNullOrUndefined } from '@utils';
import StatusCode from 'status-code-enum';
import { Container, Service } from 'typedi';

@Service()
export class UsersProfileService extends BaseService {
  private readonly _repository: UserProfileRepository;

  public constructor() {
    super();
    this._repository = Container.get(UserProfileRepository);
  }

  public async get(reqDto: GetUserProfileReqDto): Promise<IUserProfileDto | null> {
    const user = await this._repository.getByUuid(reqDto.userGuid);

    if (isNullOrUndefined(user)) {
      throw new TranslatableHttpException(StatusCode.ClientErrorBadRequest, errorKeys.users.User_Does_Not_Exist, { id: reqDto.userGuid });
    }

    const userProfile = userToIUserProfile(user!);

    this._eventDispatcher.dispatch(events.users.userProfileRetrieved, new UserProfileRetrievedEvent(userProfile, reqDto.currentUserId));

    return userProfile;
  }
}
