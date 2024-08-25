export abstract class Event {
  public readonly currentUserId: number | undefined;

  constructor(currentUserId: number | undefined = undefined) {
    this.currentUserId = currentUserId;
  }
}
