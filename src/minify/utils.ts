import type {
  MinifiedErrorOutput,
  MinifiedMimeBundle,
  MinifiedMimePayload,
  MinifiedOutput,
  MinifiedStreamOutput,
} from './types';

export const MAX_CHARS = 25000;
export const TRUNCATED_CHARS_COUNT = 64;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DEFAULT_HASH_WARNING(content: string): string {
  console.warn(
    'nbtx is not using a hashing library to create the hash.\nThe IDs generated are random, please provide a `computeHash` function, for example using "crypto".\nSee nbtx README for more information.',
  );
  return `not-a-hash-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function isNotNull<T>(arg: T | null): arg is T {
  return arg != null;
}

export function ensureSafePath(path: string): string {
  return path.replace('/', '-');
}

/**
 * Given a list of minified outputs, perform a function on each
 *
 * This function traverses into mime outputs which may have multiple outputs included together.
 */
export function walkOutputs(
  outputs: MinifiedOutput[],
  func: (obj: MinifiedStreamOutput | MinifiedErrorOutput | MinifiedMimePayload) => void,
) {
  outputs.forEach((output: MinifiedOutput) => {
    if ('data' in output && output.data) {
      Object.entries(output.data as MinifiedMimeBundle).forEach(([, bundle]) => {
        func(bundle);
      });
    } else {
      func(output as MinifiedStreamOutput | MinifiedErrorOutput);
    }
  });
}

export function ensureString(maybeString: string[] | string | undefined, joinWith = ''): string {
  if (!maybeString) return '';
  if (typeof maybeString === 'string') return maybeString;
  if (maybeString.join) return maybeString.join(joinWith);
  return maybeString as unknown as string;
}
