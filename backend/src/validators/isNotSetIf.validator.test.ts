import { validate } from 'class-validator';
import { IsNotSetIf } from './isNotSetIf.validator';

class TestClass {
  @IsNotSetIf('relatedProperty')
  public targetProperty: any;

  public relatedProperty: any;
}

describe('IsNotSetIf', () => {
  it('should be valid if related property is null', async () => {
    const instance = new TestClass();
    instance.relatedProperty = null;
    instance.targetProperty = 'some value';

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be valid if related property is undefined', async () => {
    const instance = new TestClass();
    instance.relatedProperty = undefined;
    instance.targetProperty = 'some value';

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be valid if related property is set and target property is null', async () => {
    const instance = new TestClass();
    instance.relatedProperty = 'some value';
    instance.targetProperty = null;

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be valid if related property is set and target property is undefined', async () => {
    const instance = new TestClass();
    instance.relatedProperty = 'some value';
    instance.targetProperty = undefined;

    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  it('should be invalid if related property is set and target property is also set', async () => {
    const instance = new TestClass();
    instance.relatedProperty = 'some value';
    instance.targetProperty = 'another value';

    const errors = await validate(instance);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isNotSetIf).toBeDefined();
  });
});
