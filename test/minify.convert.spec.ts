import { convertToIOutputs, minifyCellOutput } from '../src/minify';
import { minifyMimeOutput } from '../src/minify/mime';
import { minifyErrorOutput, minifyStreamOutput } from '../src/minify/text';
import { MinifiedContentCache } from '../src/minify/types';
import { makeNativeErrorOutput, makeNativeMimeOutput, makeNativeStreamOutput } from './helpers';

const default_opts = {
  maxCharacters: 20,
  truncateTo: 10,
};

describe('minify.convert', () => {
  test.each([
    ['text/plain', 'execute_result', 'hello world'],
    ['text/latex', 'execute_result', '\\LaTeX rules wtf'],
    ['text/html', 'execute_result', '<p>very short</p>'],
    ['application/json', 'execute_result', { some: 'json' }],
    ['text/plain', 'execute_result', 'more than twenty characters here for sure'],
    [
      'text/html',
      'execute_result',
      '<div><article><h1>Hello World</h1><p>Welcome to the future</p></article></div>',
    ],
    // Note that the results for base64 encoded data does not include the "header" of "data:image/png;base64,"
    ['image/gif', 'execute_result', 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'],
    ['image/png', 'execute_result', 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'],
    ['application/json', 'execute_result', { some: { json: 'object' } }],
  ])(
    'minifyMimeOutput - single %s',
    async (mimetype: string, output_type: string, content: any) => {
      const output = makeNativeMimeOutput(output_type, mimetype, content);
      const cache = {} as MinifiedContentCache;
      const minified = await minifyMimeOutput(output, cache, default_opts);
      const ioutputs = convertToIOutputs([minified], cache);
      expect(ioutputs[0]).toEqual(output);
    },
  );

  test.each([['hello world'], ['123\n456789012345678901']])(
    'minifyStreamOutput',
    async (content: string | string[]) => {
      const output = makeNativeStreamOutput(content);
      const cache = {} as MinifiedContentCache;
      const minified = await minifyStreamOutput(output, cache, default_opts);
      const ioutputs = convertToIOutputs([minified], cache);
      expect(ioutputs[0]).toEqual(output);
    },
  );
  test.each([
    [['hello world'], 20],
    [['hello world'], 5],
  ])('minifyErrorOutput', async (traceback: string[], maxCharacters: number) => {
    const output = makeNativeErrorOutput(traceback);
    const cache = {} as MinifiedContentCache;
    const minified = await minifyErrorOutput(output, cache, {
      ...default_opts,
      maxCharacters,
    });
    const ioutputs = convertToIOutputs([minified], cache);
    expect(ioutputs[0]).toEqual(output);
  });
});

describe('minify.minifyCellOutputs', () => {
  test.each([[[{} as any]], [[{} as any, {} as any]]])('unrecognized', async (outputs: any[]) => {
    expect(await minifyCellOutput(outputs, {}, {})).toEqual([]);
  });
});
