import { describe, expectTypeOf, it } from 'vitest';
import type { ReadonlyRecord, RecordKey } from './common.mjs';

describe('ReadonlyRecord', () => {
  it('ReadonlyRecord<"foo", number> -> { readonly foo: number; }', () =>
    expectTypeOf<ReadonlyRecord<'foo', number>>().toEqualTypeOf<{
      readonly foo: number;
    }>());

  it('ReadonlyRecord<"bar", string> -> { readonly bar: string; }', () =>
    expectTypeOf<ReadonlyRecord<'bar', string>>().toEqualTypeOf<{
      readonly bar: string;
    }>());
});

describe('RecordKey', () => {
  it('RecordKey -> string | number | symbol', () =>
    expectTypeOf<RecordKey>().toEqualTypeOf<string | number | symbol>());
});
