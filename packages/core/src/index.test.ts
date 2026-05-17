import { describe, expect, it } from 'vitest';

describe('@kurone-kito/oneiron-core', () => {
  it('module is importable', async () => {
    const mod = await import('./index.ts');
    expect(mod).toBeDefined();
  });
});
