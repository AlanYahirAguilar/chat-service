import { SetMetadata } from '@nestjs/common';

export const PRIVILEGES_KEY = 'privileges';
export const RequirePrivilege = (...privileges: string[]) =>
  SetMetadata(PRIVILEGES_KEY, privileges);
