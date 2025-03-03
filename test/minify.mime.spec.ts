import { minifyMimeOutput } from '../src/minify/mime';
import type { MinifiedContentCache } from '../src/minify/types';
import { computeHash, makeNativeMimeOutput } from './helpers';

const default_opts = {
  maxCharacters: 20,
  truncateTo: 10,
  computeHash,
};

describe('minify.mime', () => {
  test.each([
    ['text/plain', 'execute_result', 'hello world', undefined],
    ['text/latex', 'execute_result', '\\LaTeX rules wtf', undefined],
    ['text/html', 'execute_result', '<p>very short</p>', undefined],
    ['application/json', 'execute_result', { some: 'json' }, '{"some":"json"}'],
  ])(
    'minifyMimeOutput - single %s',
    async (mimetype: string, output_type: string, content: any, expected: string | undefined) => {
      const output = makeNativeMimeOutput(output_type, mimetype, content);
      const cache = {} as MinifiedContentCache;
      const minified = await minifyMimeOutput(output, cache, default_opts);
      expect(minified.output_type).toEqual(output_type);
      expect(minified.data).toHaveProperty(mimetype);
      expect(minified.data[mimetype].content_type).toEqual(mimetype);
      expect(minified.metadata).toEqual({ meta: 'data' });
      expect(minified.data[mimetype].hash).toEqual(undefined);
      expect(minified.data[mimetype].content).toEqual(expected ?? content);
      expect(cache).toEqual({});
    },
  );
  test.each([
    ['text/plain', 'execute_result', 'more than twenty characters here for sure', undefined],
    [
      'text/html',
      'execute_result',
      '<div><article><h1>Hello World</h1><p>Welcome to the future</p></article></div>',
      undefined,
    ],
    [
      'image/gif',
      'execute_result',
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    ],
    [
      'image/png',
      'execute_result',
      'data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    ],
    [
      'application/json',
      'execute_result',
      { some: { json: 'object' } },
      '{"some":{"json":"object"}}',
    ],
  ])(
    'minifyMimeOutputAndCache - single %s',
    async (mimetype: string, output_type: string, content: any, expected: string | undefined) => {
      const output = makeNativeMimeOutput(output_type, mimetype, content);
      const cache = {} as MinifiedContentCache;
      const minified = await minifyMimeOutput(output, cache, default_opts);
      const expectedHash = computeHash(expected ?? content);
      expect(minified.output_type).toEqual(output_type);
      expect(minified.data).toHaveProperty(mimetype);
      expect(minified.data[mimetype].content_type).toEqual(mimetype);
      expect(minified.metadata).toEqual({ meta: 'data' });
      expect(minified.data[mimetype].content).toEqual(undefined);
      expect(minified.data[mimetype].hash).toEqual(expectedHash);
      expect(cache[expectedHash]).toEqual([
        expected ?? content,
        { contentType: mimetype, encoding: mimetype.startsWith('image/') ? 'base64' : 'utf8' },
      ]);
    },
  );
  test('minifyMimeOutput - no minify %s', async () => {
    const output = makeNativeMimeOutput('execute_result', 'application/vnd.holoviews+json', '');
    expect(Object.keys(output.data)).toEqual(['application/vnd.holoviews+json']);
    const cache = {} as MinifiedContentCache;
    const minified = await minifyMimeOutput(output, cache, default_opts);
    expect(minified).toEqual({
      data: {
        'application/vnd.holoviews+json': {
          content: '',
          content_type: 'application/vnd.holoviews+json',
        },
      },
      metadata: { meta: 'data' },
      output_type: 'execute_result',
    });
  });
  test('minifyMimeOutput - multiple %s', () => {
    //pass
  });
});
