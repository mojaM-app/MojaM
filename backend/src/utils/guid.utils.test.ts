import { Guid } from 'guid-typescript';
import { isGuid } from './guid.utils';

describe('isGuid', () => {
  it('should return false for null value', () => {
    expect(isGuid(null)).toBe(false);
  });

  it('should return false for undefined value', () => {
    expect(isGuid(undefined)).toBe(false);
  });

  it('should return false for non-string value', () => {
    expect(isGuid(123)).toBe(false);
    expect(isGuid({})).toBe(false);
    expect(isGuid([])).toBe(false);
    expect(isGuid([Guid.raw()])).toBe(false);
    expect(isGuid(() => {})).toBe(false);
    expect(
      isGuid(() => {
        return Guid.raw();
      }),
    ).toBe(false);
  });

  it('should return false for invalid GUID', () => {
    expect(isGuid('')).toBe(false);
    expect(isGuid(' ')).toBe(false);
    expect(isGuid('4880367593064f4cab697d01d82b301c')).toBe(false);
    expect(isGuid('XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX')).toBe(false);
    expect(isGuid('not-a-guid')).toBe(false);
  });

  it('should return true for valid GUID', () => {
    expect(isGuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('should return true for uppercase GUID', () => {
    expect(isGuid('F47AC10B-58CC-4372-A567-0E02B2C3D479')).toBe(true);
  });

  it('should return true for mixed-case GUID', () => {
    expect(isGuid('f47Ac10B-58cC-4372-A567-0e02b2C3d479')).toBe(true);
  });

  it('should return false for GUIDs with braces', () => {
    expect(isGuid('{f47ac10b-58cc-4372-a567-0e02b2c3d479}')).toBe(false);
  });

  it('should return false for GUIDs without hyphens', () => {
    expect(isGuid('f47ac10b58cc4372a5670e02b2c3d479')).toBe(false);
  });

  it('should return false for almost-valid GUIDs', () => {
    // One character too short
    expect(isGuid('f47ac10b-58cc-4372-a567-0e02b2c3d47')).toBe(false);
    // One character too long
    expect(isGuid('f47ac10b-58cc-4372-a567-0e02b2c3d4790')).toBe(false);
    // Wrong hyphen positions
    expect(isGuid('f47ac10-b58cc-4372-a567-0e02b2c3d479')).toBe(false);
  });
});
