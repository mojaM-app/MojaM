export abstract class BaseReqDto {
  public readonly currentUserId: number | undefined;

  constructor(currentUserId: number | undefined) {
    this.currentUserId = currentUserId;
  }
}
