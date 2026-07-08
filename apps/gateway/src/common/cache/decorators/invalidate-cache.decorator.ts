import { SetMetadata } from '@nestjs/common';

export const INVALIDATE_CACHE_KEY = 'invalidate_cache_key';
export const InvalidateCache = (pattern: string) =>
  SetMetadata(INVALIDATE_CACHE_KEY, pattern);
