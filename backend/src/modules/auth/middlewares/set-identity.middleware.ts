import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { UnauthorizedException } from '@exceptions/UnauthorizedException';
import { error_keys } from '@exceptions/error.keys';
import { DataStoredInToken } from '@modules/auth/interfaces/DataStoredInToken';
import { RequestWithUser } from '@modules/auth/interfaces/RequestWithUser';
import { PermissionRepository } from '@modules/permissions/repositories/permission.repository';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { User } from '@prisma/client';
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

export const setIdentity = async (req: RequestWithUser, res: Response, next: NextFunction) => {
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
      const userRepository = Container.get(UserRepository);
      const user = await userRepository.getByUuid(Guid.parse(id));

      if (user) {
        req.user = <User>{
          id: user.id,
          uuid: user.uuid,
        };

        const permissionRepository = Container.get(PermissionRepository);
        req.permissions = await permissionRepository.getUserPermissions(user.id);

        next();
      } else {
        next(new UnauthorizedException(error_keys.users.login.Wrong_Authentication_Token));
      }
    } else {
      req.user = null;
      req.permissions = [];
      next();
    }
  } catch (error) {
    next(new UnauthorizedException(error_keys.users.login.Wrong_Authentication_Token));
  }
};
