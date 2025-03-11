import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_EXPIRE_IN, REFRESH_TOKEN_SECRET, SECRET_AUDIENCE, SECRET_ISSUER } from '@config';
import { UnauthorizedException, errorKeys } from '@exceptions';
import { IRequestWithIdentity } from '@interfaces';
import { Identity } from '@modules/auth';
import { UserPermissionsRepository } from '@modules/permissions';
import { UserRepository } from '@modules/users';
import { isNullOrEmptyString, isNullOrUndefined } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import Container from 'typedi';

const getAuthorization = (req: Request): string | null => {
  let header: string | string[] | undefined = req?.headers?.Authorization;

  if (isNullOrUndefined(header)) {
    header = req?.headers?.authorization;
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

export const getAccessTokenSecret = (): string => {
  if (isNullOrEmptyString(ACCESS_TOKEN_SECRET)) {
    throw new Error('ACCESS_TOKEN_SECRET is not set. Go to the .env file and set it.');
  }

  return ACCESS_TOKEN_SECRET!;
};

export const getRefreshTokenSecret = (userId: number, userRefreshTokenKey: string): string => {
  if (isNullOrEmptyString(REFRESH_TOKEN_SECRET)) {
    throw new Error('REFRESH_TOKEN_SECRET is not set. Go to the .env file and set it.');
  }

  if (isNullOrEmptyString(userRefreshTokenKey)) {
    throw new Error(`User with id=${userId} has an empty RefreshTokenKey. Go to the database and set it.`);
  }

  return REFRESH_TOKEN_SECRET + userRefreshTokenKey;
};

export const getTokenAudience = (): string => {
  if (isNullOrEmptyString(SECRET_AUDIENCE)) {
    throw new Error('SECRET_AUDIENCE is not set. Go to the .env file and set it.');
  }

  return SECRET_AUDIENCE!;
};

export const getTokenIssuer = (): string => {
  if (isNullOrEmptyString(SECRET_ISSUER)) {
    throw new Error('SECRET_ISSUER is not set. Go to the .env file and set it.');
  }

  return SECRET_ISSUER!;
};

export const getRefreshTokenExpiration = (): string => {
  const defaultRefreshTokenExpiration: string = '1d';

  if (isNullOrEmptyString(REFRESH_TOKEN_EXPIRE_IN)) {
    return defaultRefreshTokenExpiration;
  }

  return REFRESH_TOKEN_EXPIRE_IN ?? defaultRefreshTokenExpiration;
};

export const getAccessTokenExpiration = (): string => {
  const defaultAccessTokenExpiration: string = '10m';

  return defaultAccessTokenExpiration;
};

export const ACCESS_TOKEN_ALGORITHM = 'HS256';

export const setIdentity = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authorization: string | null = getAuthorization(req);
    if (isNullOrEmptyString(authorization)) {
      req.identity = new Identity(undefined, []);
      next();
    } else {
      const { sub } = verify(authorization!, getAccessTokenSecret(), {
        complete: true,
        algorithms: [ACCESS_TOKEN_ALGORITHM],
        clockTolerance: 0,
        ignoreExpiration: false,
        ignoreNotBefore: false,
        audience: getTokenAudience(),
        issuer: getTokenIssuer(),
      }).payload as JwtPayload;
      const userRepository = Container.get(UserRepository);
      const user = await userRepository?.getByUuid(sub);

      if (isNullOrUndefined(user)) {
        next(new UnauthorizedException(errorKeys.login.Wrong_Authentication_Token));
      } else {
        const permissionRepository = Container.get(UserPermissionsRepository);
        const permissions = await permissionRepository.get(user);
        req.identity = new Identity(user, permissions);
        next();
      }
    }
  } catch (error) {
    req.identity = new Identity(undefined, []);
    next();
  }
};

export let exportsForTesting: any;
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  exportsForTesting = { getAuthorization };
}
