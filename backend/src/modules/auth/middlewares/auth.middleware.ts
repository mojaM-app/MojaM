import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@modules/auth/interfaces/auth.interface';
import { PrismaClient } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

const getAuthorization = (req: Request) => {
  const coockie: any = req.cookies['Authorization'];
  if (coockie) {
    return coockie;
  }

  const header: string | undefined = req.header('Authorization');
  if (header) {
    return header.split('Bearer ')[1];
  }

  return null;
};

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { id } = (await verify(Authorization, SECRET_KEY)) as DataStoredInToken;
      const users = new PrismaClient().user;
      const findUser = await users.findUnique({ where: { id: Number(id) } });

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
