import DBClient from '@/prisma/DBClient';
import { SECRET_AUDIENCE, SECRET_ISSUER, SECRET_KEY } from '@config';
import { UnauthorizedException } from '@exceptions/UnauthorizedException';
import { error_keys } from '@exceptions/error.keys';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { DataStoredInToken } from '../interfaces/DataStoredInToken';
import { RequestWithUser } from '../interfaces/RequestWithUser';

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
      const dbContext = DBClient.getDbContext();
      const users = dbContext.user;
      const user = await users.findUnique({ where: { uuid: id } });

      if (user) {
        req.user = user;
        const userPermissions = dbContext.userSystemPermission;
        req.permissions = (await userPermissions.findMany({ where: { userId: user.id } })).map(m => m.permissionId);

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
