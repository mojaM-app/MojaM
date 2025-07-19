export enum BulletinState {
  Draft = 1,
  Published = 2,
}

export type BulletinStateType = 1 | 2;

export const BulletinStateValue = {
  Draft: 1 as BulletinStateType,
  Published: 2 as BulletinStateType,
};
