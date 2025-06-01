export { UserDetailsRoute } from './routes/user-details.routes';
export { UserListRoute } from './routes/user-list.routes';
export { UserRoute } from './routes/user.routes';
export { UserProfileRoute } from './routes/user-profile.routes';
export { CreateUserResponseDto } from './dtos/create-user.dto';
export { GetUserResponseDto, IGetUserDto } from './dtos/get-user.dto';

export { UserActivatedEvent } from './events/user-activated-event';
export { UserCreatedEvent } from './events/user-created-event';
export { UserDeactivatedEvent } from './events/user-deactivated-event';
export { UserDeletedEvent } from './events/user-deleted-event';
export { UserDetailsRetrievedEvent } from './events/user-details-retrieved-event';
export { UserListRetrievedEvent } from './events/user-list-retrieved-event';
export { UserProfileRetrievedEvent } from './events/user-profile-retrieved-event';
export { UserProfileUpdatedEvent } from './events/user-profile-updated-event';
export { UserRetrievedEvent } from './events/user-retrieved-event';
export { UserUnlockedEvent } from './events/user-unlocked-event';
export { UserUpdatedEvent } from './events/user-updated-event';

import { IUser } from '@core';
import { CreateUserDto } from './dtos/create-user.dto';
import { generateValidUserWithPassword, generateValidUserWithPin } from './helpers/tests.helpers';

export let userTestHelpers: {
  generateValidUserWithPassword: () => CreateUserDto & IUser;
  generateValidUserWithPin: () => CreateUserDto & IUser;
};
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  userTestHelpers = {
    generateValidUserWithPassword,
    generateValidUserWithPin,
  };
}
