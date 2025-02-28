/* eslint-disable no-param-reassign */
import type { IDisplayData, IExecuteResult, MultilineString } from '@jupyterlab/nbformat';
import type { MinifiedContentCache, MinifiedMimeBundle, MinifyOptions } from './types';
import { ensureString } from './utils';

function minifyContent(
  content: string,
  contentType: string,
  isBase64Image: boolean,
  outputCache: MinifiedContentCache,
  opts: MinifyOptions,
) {
  console.log('minifyContent', content, contentType, isBase64Image, outputCache, opts);
  if (content.length === 0) {
    return { content, content_type: contentType };
  }
  if (!isBase64Image && content.length <= opts.maxCharacters) {
    return { content, content_type: contentType };
  }
  let hash: string;
  if (isBase64Image) {
    const [data] = content.split(';base64,').reverse(); // reverse as sometimes there is no header
    hash = opts.computeHash(data);
    outputCache[hash] = [data, { contentType, encoding: 'base64' }];
  } else {
    hash = opts.computeHash(content);
    outputCache[hash] = [content, { contentType, encoding: 'utf8' }];
  }
  return {
    content_type: contentType,
    hash,
  };
}

export async function minifyMimeOutput(
  output: IDisplayData | IExecuteResult,
  outputCache: MinifiedContentCache,
  opts: MinifyOptions,
) {
  const items = await Promise.all(
    Object.entries(output.data).map(async ([mimetype, mimeContent]) => {
      let isBase64Image = false;
      let stringContent = '';
      if (
        mimetype !== 'application/javascript' &&
        (mimetype === 'application/json' ||
          (mimetype.startsWith('application/') && typeof mimeContent === 'object'))
      ) {
        stringContent = JSON.stringify(mimeContent);
      } else {
        stringContent = ensureString(mimeContent as MultilineString | string);
      }

      if (!mimetype.startsWith('image/svg') && mimetype.startsWith('image/')) {
        isBase64Image = true;
      }

      // NOTE we insist on creating stringified content as this can / will end up in a
      // database with limited support for nested objects. Stringifcaiton here means
      // an inverse operation is needed on convertToIOutputs to get back to the original
      return minifyContent(stringContent, mimetype, isBase64Image, outputCache, opts);
    }),
  );

  const data: MinifiedMimeBundle = items.reduce(
    (bundle, item) => ({ ...bundle, [item.content_type]: item }),
    {},
  );

  return {
    output_type: output.output_type,
    execution_count: output.execution_count as number | undefined,
    metadata: output.metadata,
    data,
  };
}
