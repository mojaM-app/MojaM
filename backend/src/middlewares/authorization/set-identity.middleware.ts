import {
  ACCESS_TOKEN_ALGORITHM,
  ACCESS_TOKEN_SECRET,
  NODE_ENV,
  REFRESH_TOKEN_EXPIRE_IN,
  REFRESH_TOKEN_SECRET,
  SECRET_AUDIENCE,
  SECRET_ISSUER,
} from '@config';
import { Identity, IPermissionsService, IRequestWithIdentity, IUserService } from '@core';
import { errorKeys, UnauthorizedException } from '@exceptions';
import { isNullOrEmptyString, isNullOrUndefined, isString } from '@utils';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload, verify } from 'jsonwebtoken';
import Container from 'typedi';
import { SecurityLoggerService } from '../security/security-logger.service';

const getAuthorization = (req: Request): string | null => {
  let header: string | string[] | undefined = req?.headers?.Authorization;

  if (isNullOrUndefined(header)) {
    header = req?.headers?.authorization;
  }

  if (Array.isArray(header) && header.length > 0) {
    header = header[0];
  }

  if (isNullOrUndefined(header) || !isString(header)) {
    return null;
  }

  header = header as string;
  return header.startsWith('Bearer ') && header.split('Bearer ').length === 2 ? header.substring(7) : null;
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

  return REFRESH_TOKEN_EXPIRE_IN!;
};

export const getAccessTokenExpiration = (): string => {
  const defaultAccessTokenExpiration: string = '10m';

  return defaultAccessTokenExpiration;
};

export const setIdentity = async (req: IRequestWithIdentity, res: Response, next: NextFunction): Promise<void> => {
  const securityLoggerService = Container.get(SecurityLoggerService);
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
      const userService = Container.get<IUserService>('IUserService');
      const user = await userService.getByUuid(sub);

      if (isNullOrUndefined(user)) {
        securityLoggerService.logTokenValidationFailure({ req, reason: 'User not found for token subject' });
        next(new UnauthorizedException(errorKeys.login.Wrong_Authentication_Token));
      } else {
        const permissionsService = Container.get<IPermissionsService>('IPermissionsService');
        const permissions = await permissionsService.getUserPermissions(user);
        req.identity = new Identity(user, permissions);
        next();
      }
    }
  } catch (error) {
    securityLoggerService.logError({
      req,
      message: 'Error in setIdentity middleware',
      error,
    });

    // Log specific JWT errors for security monitoring
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        securityLoggerService.logTokenValidationFailure({ req, reason: 'Token expired' });
      } else if (error.message.includes('invalid')) {
        securityLoggerService.logTokenValidationFailure({ req, reason: 'Invalid token format' });
      } else if (error.message.includes('malformed')) {
        securityLoggerService.logTokenValidationFailure({ req, reason: 'Malformed token' });
      } else {
        securityLoggerService.logTokenValidationFailure({ req, reason: `JWT validation error: ${error.message}` });
      }
    }

    req.identity = new Identity(undefined, []);
    next();
  }
};

export let exportsForTesting: any;
if (NODE_ENV === 'test' || NODE_ENV === 'development') {
  exportsForTesting = { getAuthorization };
}
