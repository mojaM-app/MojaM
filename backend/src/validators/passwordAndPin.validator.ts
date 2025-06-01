import { isNullOrUndefined } from '@utils';
import { registerDecorator, ValidationOptions } from 'class-validator';
import Container from 'typedi';
import { PasswordService } from '../modules/auth/services/password.service';
import { PinService } from '../modules/auth/services/pin.service';

/**
 * Check if both password and pin are valid
 */
export const IsPasswordOrPinValid = (validationOptions?: ValidationOptions): PropertyDecorator => {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'isPasswordOrPinValid',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
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
    });
  };
};
