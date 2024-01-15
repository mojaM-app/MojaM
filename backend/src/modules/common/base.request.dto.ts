export abstract class BaseReqDto {
  currentUserId: number | undefined;

  public constructor(currentUserId: number | undefined) {
    this.currentUserId = currentUserId;
  }
}
