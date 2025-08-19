import { registerDecorator, type ValidationDecoratorOptions, type ValidationOptions } from 'class-validator';
import { Container } from 'typedi';
import { isNullOrUndefined } from '@utils';
import { PasswordService } from '../modules/auth/services/password.service';
import { PinService } from '../modules/auth/services/pin.service';

/**
 * Check if both password and pin are valid
 */
export const isPasswordOrPinValid = (validationOptions?: ValidationOptions): PropertyDecorator => {
  return (target: Object, propertyName: string): void => {
    registerDecorator({
      name: 'isPasswordOrPinValid',
      target: target.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (isNullOrUndefined(value)) {
            return false;
          }

          const passwordService = Container.get(PasswordService);
          const isPasswordValid = passwordService.isValid(value as string);
          const pinService = Container.get(PinService);
          const isPinValid = pinService.isValid(value as string);
          return isPasswordValid || isPinValid;
        },
      },
    } satisfies ValidationDecoratorOptions);
  };
};
