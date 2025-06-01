import { Identity } from '@middlewares';
import { Request } from 'express';

export interface IRequestWithIdentity extends Request {
  identity: Identity;
}
