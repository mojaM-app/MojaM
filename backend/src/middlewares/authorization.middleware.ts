import { ForbiddenException, UnauthorizedException } from '@exceptions';
import { IRequestWithIdentity } from '@interfaces';
import { Identity } from '@modules/auth';
import { NextFunction, Response } from 'express';

/**
 * Creates middleware that checks if the user is authenticated and has the required permission.
 * @param permissionCheck Function that checks if the user has the required permission
 * @returns Express middleware function
 */
export const requirePermission = (
  permissionCheck: (identity: Identity) => boolean,
): ((req: IRequestWithIdentity, res: Response, next: NextFunction) => void) => {
  return (req: IRequestWithIdentity, res: Response, next: NextFunction): void => {
    if (!req.identity?.isAuthenticated()) {
      next(new UnauthorizedException());
    } else if (!permissionCheck(req.identity)) {
      next(new ForbiddenException());
    } else {
      next();
    }
  };
};
