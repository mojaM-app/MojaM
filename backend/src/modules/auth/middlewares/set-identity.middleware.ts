import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { UnauthorizedException, error_keys } from '@exceptions';
import { DataStoredInToken, Identity, RequestWithIdentity } from '@modules/auth';
import { PermissionRepository } from '@modules/permissions';
import { UsersRepository } from '@modules/users';
import { NextFunction, Request, Response } from 'express';
import { Guid } from 'guid-typescript';
import { verify } from 'jsonwebtoken';
import Container from 'typedi';

const getAuthorization = (req: Request): string => {
  const cookie: any = req.cookies['Authorization'];
  if (cookie) {
    return cookie;
  }

  const header: string | undefined = req.header('Authorization');
  if (header) {
    return header.split('Bearer ')[1];
  }

  return null;
};

export const setIdentity = async (req: RequestWithIdentity, res: Response, next: NextFunction) => {
  try {
    const authorization = getAuthorization(req);
    if (authorization && authorization.length) {
      const { id } = verify(authorization, SECRET_KEY, {
        complete: true,
        algorithms: ['HS256'],
        clockTolerance: 0,
        ignoreExpiration: false,
        ignoreNotBefore: false,
        audience: SECRET_AUDIENCE,
        issuer: SECRET_ISSUER,
      }).payload as DataStoredInToken;
      const userRepository = Container.get(UsersRepository);
      const user = await userRepository.getByUuid(Guid.parse(id));

      if (user) {
        const permissionRepository = Container.get(PermissionRepository);
        const permissions = await permissionRepository.getUserPermissions(user.id);
        req.identity = new Identity(user, permissions);
        next();
      } else {
        next(new UnauthorizedException(error_keys.login.Wrong_Authentication_Token));
      }
    } else {
      req.identity = new Identity(undefined, []);
      next();
    }
  } catch (error) {
    next(new UnauthorizedException(error_keys.login.Wrong_Authentication_Token));
  }
};
