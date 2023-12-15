import { SystemPermission } from '@modules/permissions/system-permission.enum';
import { User } from '@prisma/client';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: User;
  permissions: SystemPermission[];
}
