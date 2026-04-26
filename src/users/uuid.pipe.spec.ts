import {
  ParseUUIDPipe,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ParseUUIDPipe', () => {
  let pipe: ParseUUIDPipe;
  let metadata: ArgumentMetadata;

  beforeEach(() => {
    pipe = new ParseUUIDPipe();
    metadata = {
      type: 'param',
      data: 'id',
      metatype: String,
    };
  });

  it('passes valid UUID v4', async () => {
    const validV4 = '550e8400-e29b-41d4-a716-446655440000';

    const result = await pipe.transform(validV4, metadata);

    expect(result).toBe(validV4);
  });

  it('passes valid UUID v1', async () => {
    const validV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

    const result = await pipe.transform(validV1, metadata);

    expect(result).toBe(validV1);
  });

  it('passes valid uppercase UUID', async () => {
    const validUppercase = '550E8400-E29B-41D4-A716-446655440000';

    const result = await pipe.transform(validUppercase, metadata);

    expect(result).toBe(validUppercase);
  });

  it('throws on non-uuid string', async () => {
    await expect(
      pipe.transform('not-a-uuid', metadata),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws on empty string', async () => {
    await expect(pipe.transform('', metadata)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws on uuid without dashes', async () => {
    await expect(
      pipe.transform('550e8400e29b41d4a716446655440000', metadata),
    ).rejects.toThrow(BadRequestException);
  });
});
