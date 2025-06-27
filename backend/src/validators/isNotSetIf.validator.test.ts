import { validate } from 'class-validator';
import { isNotSetIf } from './isNotSetIf.validator';

class TestClass {
  @isNotSetIf('relatedProperty')
  public targetProperty: string | null | undefined;

  public relatedProperty: string | null | undefined;
}

describe('IsNotSetIf', () => {
  it('should be valid if related property is null', async () => {
    const instance = new TestClass();
    instance.relatedProperty = null;
    instance.targetProperty = 'some value 1';

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be valid if related property is undefined', async () => {
    const instance = new TestClass();
    instance.relatedProperty = undefined;
    instance.targetProperty = 'some value 2';

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be valid if related property is set and target property is null', async () => {
    const instance = new TestClass();
    instance.relatedProperty = 'some value 3';
    instance.targetProperty = null;

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be valid if related property is set and target property is undefined', async () => {
    const instance = new TestClass();
    instance.relatedProperty = 'some value 4';
    instance.targetProperty = undefined;

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be invalid if related property is set and target property is also set', async () => {
    const instance = new TestClass();
    instance.relatedProperty = 'some value 5';
    instance.targetProperty = 'another value';

    const errors = await validate(instance);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isNotSetIf).toBeDefined();
  });
});
