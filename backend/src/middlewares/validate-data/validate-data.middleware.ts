import { NODE_ENV } from '@config';
import { BadRequestException } from '@exceptions';
import { isNullOrUndefined } from '@utils';
import { type ClassConstructor, plainToInstance } from 'class-transformer';
import { validateOrReject, type ValidationError } from 'class-validator';
import type { NextFunction, Request, Response } from 'express';

const getErrorConstraints = (error: ValidationError | null | undefined): string[] => {
  const constraints: string[] = [];

  if (error !== undefined && error !== null) {
    if (!isNullOrUndefined(error.constraints)) {
      constraints.push(...Object.values(error.constraints!));
    }

    if ((error.children?.length ?? 0) > 0) {
      error.children!.forEach((child: ValidationError) => {
        const childConstraints = getErrorConstraints(child);
        constraints.push(...childConstraints);
      });
    }
  }

  return [...new Set(constraints)];
};

export const validateData = (
  type: ClassConstructor<object>,
  skipMissingProperties = false,
  whitelist = false,
  forbidNonWhitelisted = false,
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(type, req.body);

    await validateOrReject(dto, { skipMissingProperties, whitelist, forbidNonWhitelisted })
      .then(() => {
        req.body = dto;
        next();
      })
      .catch((errors: ValidationError[]) => {
        const message = [...new Set(errors.map((error: ValidationError) => getErrorConstraints(error)))].join(',');
        next(new BadRequestException(message));
      });
  };
};

export let exportsForTesting: { getErrorConstraints: (error: ValidationError | null | undefined) => string[] };
if (NODE_ENV === 'test' || NODE_ENV === 'development') {
  exportsForTesting = { getErrorConstraints };
}
