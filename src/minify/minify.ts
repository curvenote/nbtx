import { IOutput, IStream, IError, IDisplayData, IExecuteResult } from '@jupyterlab/nbformat';
import { minifyMimeOutput } from './mime';
import { minifyErrorOutput, minifyStreamOutput } from './text';
import { MinifiedContentCache, MinifiedOutput, MinifyOptions } from './types';
import { isNotNull, MAX_CHARS, TRUNCATED_CHARS_COUNT } from './utils';

async function minifyOneOutputItem(
  output: IOutput,
  outputCache: MinifiedContentCache,
  opts: MinifyOptions,
): Promise<MinifiedOutput | null> {
  if (!('output_type' in output)) return null;
  switch (output.output_type) {
    case 'stream':
      return minifyStreamOutput(output as IStream, outputCache, opts);
    case 'error':
      return minifyErrorOutput(output as IError, outputCache, opts);
    case 'update_display_data':
    case 'display_data':
    case 'execute_result':
      return minifyMimeOutput(output as IDisplayData | IExecuteResult, outputCache, opts);
    default:
      return null;
  }
}

export async function minifyCellOutput(
  outputs: IOutput[],
  outputCache: MinifiedContentCache,
  opts: Partial<MinifyOptions> = {},
): Promise<MinifiedOutput[]> {
  const options = {
    maxCharacters: opts.maxCharacters ?? MAX_CHARS,
    truncateTo: opts.truncateTo ?? TRUNCATED_CHARS_COUNT,
  };
  const minifiedOrNull = await Promise.all(
    outputs.map(async (output) => minifyOneOutputItem(output, outputCache, options)),
  );
  return minifiedOrNull.filter(isNotNull);
}
