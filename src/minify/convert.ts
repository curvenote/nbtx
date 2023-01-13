import { IOutput } from '@jupyterlab/nbformat';
import { MinifiedContentCache, MinifiedOutput } from './types';

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
            if (content && !mimetype.startsWith('image/svg') && mimetype.startsWith('image/')) {
              content = `data:${mimetype};base64,${content}`;
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
