import {
  registerDecorator,
  type ValidationArguments,
  type ValidationDecoratorOptions,
  type ValidationOptions,
} from 'class-validator';
import { isNullOrUndefined } from '@utils';

/**
 * Check if property is not set if related property is set
 */
export const isNotSetIf = (property: string, validationOptions?: ValidationOptions): PropertyDecorator => {
  return (target: Object, propertyName: string): void => {
    registerDecorator({
      name: 'isNotSetIf',
      target: target.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          if (isNullOrUndefined(relatedValue)) {
            return true;
          }

          return isNullOrUndefined(value);
        },
      },
    } satisfies ValidationDecoratorOptions);
  };
};
