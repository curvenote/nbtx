import { createHash } from 'crypto';
import {
  MinifiedErrorOutput,
  MinifiedMimeBundle,
  MinifiedMimePayload,
  MinifiedOutput,
  MinifiedStreamOutput,
} from './types';

export const MAX_CHARS = 25000;
export const TRUNCATED_CHARS_COUNT = 64;

export function isNotNull<T>(arg: T | null): arg is T {
  return arg != null;
}

export function ensureSafePath(path: string): string {
  return path.replace('/', '-');
}

export function walkOutputs(
  outputs: MinifiedOutput[],
  func: (
    hash: string,
    obj: MinifiedStreamOutput | MinifiedErrorOutput | MinifiedMimePayload,
  ) => void,
) {
  outputs.forEach((output: MinifiedOutput) => {
    if ('hash' in output && output.hash) {
      // eslint-disable-next-line no-param-reassign
      func(output.hash, output);
    } else if ('data' in output && output.data) {
      const data = output.data as MinifiedMimeBundle;
      const mimetypes = Object.keys(data);
      mimetypes.forEach((mimetype) => {
        const bundle = data[mimetype];
        if ('hash' in bundle && bundle.hash) {
          func(bundle.hash, bundle);
        }
      });
    }
  });
}

export function computeHash(content: string) {
  return createHash('md5').update(content).digest('hex');
}

export function ensureString(maybeString: string[] | string | undefined, joinWith = ''): string {
  if (!maybeString) return '';
  if (typeof maybeString === 'string') return maybeString;
  if (maybeString.join) return maybeString.join(joinWith);
  return maybeString as unknown as string;
}
