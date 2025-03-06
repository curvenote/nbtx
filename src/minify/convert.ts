import type { IOutput } from '@jupyterlab/nbformat';
import type { MinifiedContentCache, MinifiedOutput } from './types.js';

/**
 * Given a list of minified objects, restore to original nbformat IOutput objectss
 *
 * @param minified: List of minified output objects, including stream, error, execute_result, display_data, and update_display_data types.
 * @param outputCache: MinifiedContentCache object with large output content
 */
export function convertToIOutputs(
  minified: MinifiedOutput[],
  outputCache: MinifiedContentCache,
): IOutput[] {
  return minified.map((m: MinifiedOutput) => {
    switch (m.output_type) {
      case 'stream': {
        const { hash, ...rest } = m;
        if (hash && outputCache[hash]) {
          return { ...rest, text: outputCache[hash][0] };
        }
        return rest;
      }
      case 'error': {
        const { hash, traceback, ...rest } = m;
        if (hash && outputCache[hash]) {
          return { ...rest, traceback: [outputCache[hash][0]] };
        }
        return { ...rest, traceback: [traceback] };
      }
      default: {
        return {
          ...m,
          data: Object.entries(m.data).reduce((acc, [mimetype, payload]) => {
            let { content } = payload;
            const { hash } = payload;
            if (hash && outputCache[hash]) {
              [content] = outputCache[hash];
            }

            if (
              content &&
              mimetype !== 'application/javascript' &&
              mimetype.startsWith('application/')
            ) {
              try {
                content = JSON.parse(content);
              } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(`${mimetype} is not json parsable, leaving as is`);
              }
            }

            // Jupyter outputs are just the base64 encoded data without the the "header" of "data:image/png;base64,"
            // If the header is included, this strips it out.
            if (
              content &&
              mimetype.startsWith('image/') &&
              !mimetype.startsWith('image/svg') &&
              (content as string).startsWith('data:') &&
              (content as string).includes(';base64,')
            ) {
              const [data] = content.split(';base64,').reverse(); // reverse is just to be bug-free!
              content = data;
            }

            if (!content) return acc;
            return {
              ...acc,
              [mimetype]: content,
            };
          }, {}),
        };
      }
    }
  });
}
