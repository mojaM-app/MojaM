import { IUserDetails } from '../user-list/interfaces/user-details.interfaces';
import { IUserGridItemDto } from '../user-list/interfaces/user-list.interfaces';

export function transformUser<TUserToTransform extends IUserGridItemDto | IUserDetails>(
  user: TUserToTransform
): TUserToTransform {
  user.lastLoginAt = user.lastLoginAt ? new Date(user.lastLoginAt) : undefined;
  user.joiningDate = user.joiningDate ? new Date(user.joiningDate) : undefined;
  return user;
}
