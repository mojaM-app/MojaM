import { Identity } from '@modules/auth';
import { Request } from 'express';

export interface RequestWithIdentity extends Request {
  identity: Identity;
}
