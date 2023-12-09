import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { DataStoredInToken } from '../interfaces/DataStoredInToken';
import { RequestWithUser } from '../interfaces/RequestWithUser';

const getAuthorization = (req: Request) => {
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

export const verifyToken = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const authorization = getAuthorization(req);

    if (authorization) {
      const { id } = (await verify(authorization, SECRET_KEY)) as DataStoredInToken;
      const users = new PrismaClient().user;
      const findUser = await users.findUnique({ where: { uuid: id } });

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing'));
    }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
