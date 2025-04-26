import { BadRequestException } from '@exceptions';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

const getErrorConstraints = (error: ValidationError | null | undefined): string[] => {
  const constraints: string[] = [];

  if (error !== undefined && error !== null) {
    if (error.constraints !== undefined && error.constraints !== null) {
      constraints.push(...Object.values(error.constraints));
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

export const validateData = (type: any, skipMissingProperties = false, whitelist = false, forbidNonWhitelisted = false) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dto = plainToInstance(type, req.body);

    validateOrReject(dto, { skipMissingProperties, whitelist, forbidNonWhitelisted })
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

export let exportsForTesting: any;
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  exportsForTesting = { getErrorConstraints };
}
