/*
 * Minimal Node runtime declarations for CLI v1.
 * This keeps the scaffold package typecheckable without expanding the
 * dependency surface beyond the issue's requested baseline.
 */

declare class URL {
  href: string;
  constructor(input: string, base?: string);
}

declare const console: {
  error: (...data: unknown[]) => void;
  log: (...data: unknown[]) => void;
};

declare const process: {
  argv: string[];
  exitCode?: number;
};

interface ImportMeta {
  url: string;
}

declare module 'node:fs/promises' {
  export function readFile(
    path: string | URL,
    encoding: string,
  ): Promise<string>;
}

declare module 'node:util' {
  export function parseArgs(config: {
    args?: readonly string[];
    options?: Record<
      string,
      {
        short?: string;
        type: 'boolean';
      }
    >;
    allowPositionals?: boolean;
  }): {
    values: Record<string, boolean | undefined>;
    positionals: string[];
  };
}

declare module 'node:url' {
  export function pathToFileURL(path: string): URL;
}
