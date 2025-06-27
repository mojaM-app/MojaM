import { type IUser } from '@core';
import { type CreateUserDto } from './dtos/create-user.dto';
import { generateValidUserWithPassword, generateValidUserWithPin } from './tests/test.helpers';

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

export { CreateUserResponseDto } from './dtos/create-user.dto';
export { GetUserResponseDto, type IGetUserDto } from './dtos/get-user.dto';

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
