import { Identity } from '@modules/auth';
import { Request } from 'express';

export interface IRequestWithIdentity extends Request {
  identity: Identity;
}
