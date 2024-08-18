import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { UnauthorizedException, errorKeys } from '@exceptions';
import { Identity, RequestWithIdentity } from '@modules/auth';
import { PermissionsRepository } from '@modules/permissions';
import { UsersRepository } from '@modules/users';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import Container from 'typedi';

const getAuthorization = (req: Request): string | null => {
  let header: string | string[] | undefined = req.headers.Authorization;

  if (isNullOrUndefined(header)) {
    header = req.headers.authorization;
  }

  if (Array.isArray(header) && header.length > 0) {
    header = header[0];
  }

  if (isNullOrUndefined(header)) {
    return null;
  }

  const splittedHeader = (header as string).split('Bearer ');
  return (splittedHeader?.length ?? 0) > 1 ? splittedHeader[1] : null;
};

export const setIdentity = async (req: RequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorization: string | null = getAuthorization(req);
    if (isNullOrEmptyString(authorization)) {
      req.identity = new Identity(undefined, []);
      next();
    } else {
      const { sub } = verify(authorization!, SECRET_KEY!, {
        complete: true,
        algorithms: ['HS256'],
        clockTolerance: 0,
        ignoreExpiration: false,
        ignoreNotBefore: false,
        audience: SECRET_AUDIENCE,
        issuer: SECRET_ISSUER,
      }).payload as JwtPayload;
      const userRepository = Container.get(UsersRepository);
      const user = await userRepository?.getByUuid(sub);

      if (isNullOrUndefined(user)) {
        next(new UnauthorizedException(errorKeys.login.Wrong_Authentication_Token));
      } else {
        const permissionRepository = Container.get(PermissionsRepository);
        const permissions = await permissionRepository.getUserPermissions(user!.id);
        req.identity = new Identity(user, permissions);
        next();
      }
    }
  } catch (error) {
    next(new UnauthorizedException(errorKeys.login.Wrong_Authentication_Token));
  }
};
