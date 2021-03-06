import { IStream, IError } from '@jupyterlab/nbformat';
import { ensureString } from '@curvenote/blocks';
import { IFileObjectFactoryFn } from '../files';
import { MinifiedErrorOutput, MinifiedStreamOutput, MinifyOptions } from './types';

function ensureStringEnsureNewlines(maybeString: string | string[] | undefined) {
  return typeof maybeString === 'string'
    ? (maybeString as string)
    : (maybeString as Array<string>)?.join('\n');
}

async function minifyStringOutput(
  fileFactory: IFileObjectFactoryFn,
  output: IStream | IError,
  fieldName: string,
  opts: { ensureNewlines?: boolean } & MinifyOptions,
): Promise<MinifiedStreamOutput | MinifiedErrorOutput> {
  if (!output[fieldName])
    throw Error(`Bad Field name ${fieldName} for output type ${output.output_type}`);
  const text = opts.ensureNewlines
    ? ensureStringEnsureNewlines(output[fieldName] as string | string[] | undefined)
    : ensureString(output[fieldName] as string | string[] | undefined);
  if (text && text.length <= opts.maxCharacters) return { ...(output as any), [fieldName]: text };
  const file = fileFactory(`${opts.basepath}-text_plain`);
  await file.writeString(text, 'text/plain');
  return {
    ...(output as any),
    path: file.id,
    [fieldName]: `${text.slice(0, opts.truncateTo - 3)}...`,
  };
}

export const minifyStreamOutput = async (
  fileFactory: IFileObjectFactoryFn,
  output: IStream,
  opts: MinifyOptions,
): Promise<MinifiedStreamOutput> =>
  minifyStringOutput(fileFactory, output, 'text', opts) as Promise<MinifiedStreamOutput>;

export const minifyErrorOutput = async (
  fileFactory: IFileObjectFactoryFn,
  output: IError,
  opts: MinifyOptions,
): Promise<MinifiedErrorOutput> =>
  minifyStringOutput(fileFactory, output, 'traceback', {
    ensureNewlines: true,
    ...opts,
  }) as Promise<MinifiedErrorOutput>;
