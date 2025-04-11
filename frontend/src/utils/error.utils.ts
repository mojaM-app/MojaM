export class ErrorUtils {
  public static isConflictError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'status' in error && error.status === 409;
  }

  public static isUnauthorizedError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
  }

  public static isAccountIsLockedOutError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      error.message === 'Account_Is_Locked_Out'
    );
  }
}
