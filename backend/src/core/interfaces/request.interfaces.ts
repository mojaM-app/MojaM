import { Request } from 'express';
import { Identity } from '../shared/identity';

export interface IRequestWithIdentity extends Request {
  identity: Identity;
}
