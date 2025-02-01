export class ErrorUtils {
  public static isConflictError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'status' in error && error.status === 409;
  }

  public static isUnauthorizedError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
  }
}
