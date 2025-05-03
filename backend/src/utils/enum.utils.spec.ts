import { isEnumValue } from './enum.utils';

enum ExampleStringEnum {
  Value1 = 'Value1',
  Value2 = 'Value2',
  Value3 = 'Value3',
}

enum ExampleNumberEnum {
  Value1 = 1,
  Value2 = 2,
  Value3,
}

// Mixed enum with both string and numeric values
enum MixedEnum {
  StringValue = 'StringValue',
  NumericValue = 100,
  ComputedValue = NumericValue * 2,
}

// Enum with computed values
enum ComputedEnum {
  A = 1,
  B = A * 2,
  C = A + B,
  D = 'prefix_' + 'suffix',
}

describe('isEnumValue', () => {
  it('should return true when the value is a valid enum value', () => {
    let result = isEnumValue(ExampleStringEnum, ExampleStringEnum.Value1);
    expect(result).toBe(true);

    result = isEnumValue(ExampleNumberEnum, ExampleNumberEnum.Value1);
    expect(result).toBe(true);

    result = isEnumValue(ExampleNumberEnum, ExampleNumberEnum.Value3);
    expect(result).toBe(true);
  });

  it('should return false when the value is not a valid enum value', () => {
    let result = isEnumValue(ExampleStringEnum, 'InvalidValue');
    expect(result).toBe(false);

    result = isEnumValue(ExampleStringEnum, ExampleNumberEnum.Value1 - 1);
    expect(result).toBe(false);

    result = isEnumValue(ExampleStringEnum, ExampleNumberEnum.Value1 + 1000);
    expect(result).toBe(false);
  });

  it('should handle edge cases correctly', () => {
    // null and undefined values
    let result = isEnumValue(ExampleStringEnum, null);
    expect(result).toBe(false);

    result = isEnumValue(ExampleStringEnum, undefined);
    expect(result).toBe(false);

    // Empty string if that's not a valid enum value
    result = isEnumValue(ExampleStringEnum, '');
    expect(result).toBe(false);

    // Zero as a value (often an edge case with numeric enums)
    result = isEnumValue(ExampleNumberEnum, 0);
    expect(result).toBe(false);
  });

  it('should work correctly with mixed enums', () => {
    // String value in mixed enum
    let result = isEnumValue(MixedEnum, MixedEnum.StringValue);
    expect(result).toBe(true);

    // Numeric value in mixed enum
    result = isEnumValue(MixedEnum, MixedEnum.NumericValue);
    expect(result).toBe(true);

    // Invalid values in mixed enum
    result = isEnumValue(MixedEnum, 'InvalidValue');
    expect(result).toBe(false);

    result = isEnumValue(MixedEnum, 99);
    expect(result).toBe(false);
  });

  it('should handle computed enum values correctly', () => {
    // Computed numeric value
    let result = isEnumValue(ComputedEnum, ComputedEnum.B);
    expect(result).toBe(true);

    result = isEnumValue(ComputedEnum, ComputedEnum.C);
    expect(result).toBe(true);

    // Computed string value
    result = isEnumValue(ComputedEnum, ComputedEnum.D);
    expect(result).toBe(true);

    // Raw computed values should match
    result = isEnumValue(ComputedEnum, 2); // B = A * 2 = 1 * 2 = 2
    expect(result).toBe(true);

    result = isEnumValue(ComputedEnum, 3); // C = A + B = 1 + 2 = 3
    expect(result).toBe(true);

    result = isEnumValue(ComputedEnum, 'prefix_suffix'); // D = 'prefix_' + 'suffix'
    expect(result).toBe(true);
  });

  it('should work with non-standard enum patterns', () => {
    // Testing with a "fake enum" (plain object that looks like an enum)
    const pseudoEnum = {
      Key1: 'Value1',
      Key2: 'Value2',
      Key3: 3,
    };

    let result = isEnumValue(pseudoEnum, 'Value1');
    expect(result).toBe(true);

    result = isEnumValue(pseudoEnum, 3);
    expect(result).toBe(true);

    result = isEnumValue(pseudoEnum, 'NonExistentValue');
    expect(result).toBe(false);
  });
});
