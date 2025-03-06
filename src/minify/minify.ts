import type { IOutput, IStream, IError, IDisplayData, IExecuteResult } from '@jupyterlab/nbformat';
import { minifyMimeOutput } from './mime.js';
import { minifyErrorOutput, minifyStreamOutput } from './text.js';
import type { MinifiedContentCache, MinifiedOutput, MinifyOptions } from './types.js';
import { DEFAULT_HASH_WARNING, isNotNull, MAX_CHARS, TRUNCATED_CHARS_COUNT } from './utils.js';

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

/**
 * Given a list of nbformat IOutput objects, extract large outputs and cache their content on a separate data structure
 *
 * @param outputs: List of IOutput objects, including stream, error, execute_result, display_data, and update_display_data types.
 * @param outputCache: MinifiedContentCache object for storing large output content
 * @param opts:
 *    maxCharacters - the maximum allowed length for output content to remain in outputs; larger contents will be moved to outputCache
 *    truncateTo - where applicable, truncated text outputs will remain on the output when the full text is moved to outputCache
 */
export async function minifyCellOutput(
  outputs: IOutput[],
  outputCache: MinifiedContentCache,
  opts: Partial<MinifyOptions> = {},
): Promise<MinifiedOutput[]> {
  const options = {
    maxCharacters: opts.maxCharacters ?? MAX_CHARS,
    truncateTo: opts.truncateTo ?? TRUNCATED_CHARS_COUNT,
    computeHash: opts.computeHash ?? DEFAULT_HASH_WARNING,
  };
  const minifiedOrNull = await Promise.all(
    outputs.map(async (output) => minifyOneOutputItem(output, outputCache, options)),
  );
  return minifiedOrNull.filter(isNotNull);
}
