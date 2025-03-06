/* eslint-disable no-param-reassign */
import type { IStream, IError } from '@jupyterlab/nbformat';
import type {
  MinifiedContentCache,
  MinifiedErrorOutput,
  MinifiedStreamOutput,
  MinifyOptions,
} from './types.js';
import { ensureString } from './utils.js';

function ensureStringEnsureNewlines(maybeString: string | string[] | undefined) {
  return typeof maybeString === 'string'
    ? (maybeString as string)
    : (maybeString as Array<string>)?.join('\n');
}

async function minifyStringOutput(
  output: IStream | IError,
  fieldName: string,
  outputCache: MinifiedContentCache,
  opts: { ensureNewlines?: boolean } & MinifyOptions,
): Promise<MinifiedStreamOutput | MinifiedErrorOutput> {
  if (!output[fieldName]) {
    throw Error(`Bad Field name ${fieldName} for output type ${output.output_type}`);
  }
  const text = opts.ensureNewlines
    ? ensureStringEnsureNewlines(output[fieldName] as string | string[] | undefined)
    : ensureString(output[fieldName] as string | string[] | undefined);
  if (text && text.length <= opts.maxCharacters) {
    return { ...(output as any), [fieldName]: text };
  }
  const hash = opts.computeHash(text);
  outputCache[hash] = [text, { contentType: 'text/plain', encoding: 'utf8' }];
  return {
    ...(output as any),
    hash,
    [fieldName]: `${text.slice(0, opts.truncateTo - 3)}...`,
  };
}

export const minifyStreamOutput = async (
  output: IStream,
  outputCache: MinifiedContentCache,
  opts: MinifyOptions,
): Promise<MinifiedStreamOutput> =>
  minifyStringOutput(output, 'text', outputCache, opts) as Promise<MinifiedStreamOutput>;

export const minifyErrorOutput = async (
  output: IError,
  outputCache: MinifiedContentCache,
  opts: MinifyOptions,
): Promise<MinifiedErrorOutput> =>
  minifyStringOutput(output, 'traceback', outputCache, {
    ensureNewlines: true,
    ...opts,
  }) as Promise<MinifiedErrorOutput>;
