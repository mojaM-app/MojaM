import { ValidationError } from 'class-validator';
import { exportsForTesting } from './validate-data.middleware';

const { getErrorConstraints } = exportsForTesting;

describe('getErrorConstraints', () => {
  test('should return an empty array when error is null', () => {
    const result = getErrorConstraints(null);
    expect(result).toEqual([]);
  });

  test('should return an empty array when error is undefined', () => {
    const result = getErrorConstraints(undefined);
    expect(result).toEqual([]);
  });

  test('should return an empty array when there are no constraints', () => {
    const error: ValidationError = {
      property: 'email',
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual([]);
  });

  test('should return an empty array when there are no constraints', () => {
    const error: ValidationError = {
      property: 'email',
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual([]);
  });

  test('should return an empty array when constraints are undefined', () => {
    const error: ValidationError = {
      property: 'email',
      constraints: undefined,
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual([]);
  });

  test('should return an empty array when constraints are null', () => {
    const error: ValidationError = {
      property: 'email',
      constraints: null as any,
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual([]);
  });

  test('should return constraints from the error object', () => {
    const error: ValidationError = {
      constraints: {
        isNotEmpty: 'should not be empty',
        isEmail: 'must be an email',
      },
      property: 'email',
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual(['should not be empty', 'must be an email']);
  });

  test('should return constraints from nested children', () => {
    const error: ValidationError = {
      property: 'email',
      children: [
        {
          property: 'email',
          constraints: {
            isNotEmpty: 'should not be empty',
          },
        },
        {
          property: 'email',
          children: [
            {
              constraints: {
                isEmail: 'must be an email',
              },
              property: 'email',
            },
          ],
        },
      ],
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual(['should not be empty', 'must be an email']);
  });

  test('should return unique constraints', () => {
    const error: ValidationError = {
      property: 'email',
      constraints: {
        isNotEmpty: 'should not be empty',
      },
      children: [
        {
          constraints: {
            isNotEmpty: 'should not be empty',
          },
          property: 'email',
        },
      ],
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual(['should not be empty']);
  });

  test('should handle deeply nested children', () => {
    const error: ValidationError = {
      property: 'email',
      children: [
        {
          property: 'email',
          children: [
            {
              property: 'email',
              children: [
                {
                  constraints: {
                    isEmail: 'must be an email',
                  },
                  property: 'email',
                },
              ],
            },
          ],
        },
      ],
    };
    const result = getErrorConstraints(error);
    expect(result).toEqual(['must be an email']);
  });
});
