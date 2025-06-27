import { type Request } from 'express';
import { type Identity } from '../shared/identity';

export interface IRequestWithIdentity extends Request {
  identity?: Identity;
}
