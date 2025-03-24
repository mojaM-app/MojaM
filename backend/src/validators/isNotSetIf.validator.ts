import { isNullOrUndefined } from '@utils';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Check if property is not set if related property is set
 */
export function IsNotSetIf(property: string, validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: any, propertyName: string): void {
    registerDecorator({
      name: 'isNotSetIf',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          if (isNullOrUndefined(relatedValue)) {
            return true;
          }

          return isNullOrUndefined(value);
        },
      },
    });
  };
}
