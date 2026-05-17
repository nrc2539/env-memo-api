import { randomBytes } from 'node:crypto';

export const generateToken = (): string => randomBytes(32).toString('hex');
