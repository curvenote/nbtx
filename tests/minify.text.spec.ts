import { describe, expect, test } from 'vitest';
import { minifyStreamOutput, minifyErrorOutput } from '../src/minify/text';
import type { MinifiedContentCache } from '../src/minify/types';
import { computeHash, makeNativeErrorOutput, makeNativeStreamOutput } from './helpers';

const default_opts = {
  maxCharacters: 20,
  truncateTo: 10,
  computeHash,
};

describe('minify.text', () => {
  test.each([
    ['hello world', 'hello world'],
    [['hello ', 'world'], 'hello world'],
  ])('minifyStreamOutput', async (content: string | string[], expected: string) => {
    const output = makeNativeStreamOutput(content);
    const cache = {} as MinifiedContentCache;
    const minified = await minifyStreamOutput(output, cache, default_opts);
    expect(minified.output_type).toEqual('stream');
    expect(minified.metadata).toEqual({ meta: 'data' });
    expect(minified.text).toEqual(expected);
    expect(minified.hash).toEqual(undefined);
    expect(cache).toEqual({});
  });
  test.each([
    ['123456789012345678901', '1234567...'],
    [['123', '456789012345678901'], '1234567...'],
  ])('minifyStreamOutputAndCache', async (content: string | string[], expected: string) => {
    const output = makeNativeStreamOutput(content);
    const cache = {} as MinifiedContentCache;
    const minified = await minifyStreamOutput(output, cache, default_opts);
    const joinedContent = typeof content === 'string' ? content : content.join('');
    const expectedHash = computeHash(joinedContent);
    expect(minified.output_type).toEqual('stream');
    expect(minified.metadata).toEqual({ meta: 'data' });
    expect(minified.text).toEqual(expected);
    expect(minified.hash).toEqual(expectedHash);
    expect(cache[expectedHash]).toEqual([
      joinedContent,
      { contentType: 'text/plain', encoding: 'utf8' },
    ]);
  });
  test.each([
    [['hello ', 'world'], 20, 'hello \nworld'],
    [
      [
        '\u001b[0;31m---------------------------------------------------------------------------\u001b[0m',
        '\u001b[0;31mNameError\u001b[0m                                 Traceback (most recent call last)',
        'Input \u001b[0;32mIn [5]\u001b[0m, in \u001b[0;36m<cell line: 1>\u001b[0;34m()\u001b[0m\n\u001b[0;32m----> 1\u001b[0m this \u001b[38;5;241m=\u001b[39m \u001b[43mnot_python\u001b[49m\n',
        "\u001b[0;31mNameError\u001b[0m: name 'not_python' is not defined",
      ],
      1000,
      "\u001b[0;31m---------------------------------------------------------------------------\u001b[0m\n\u001b[0;31mNameError\u001b[0m                                 Traceback (most recent call last)\nInput \u001b[0;32mIn [5]\u001b[0m, in \u001b[0;36m<cell line: 1>\u001b[0;34m()\u001b[0m\n\u001b[0;32m----> 1\u001b[0m this \u001b[38;5;241m=\u001b[39m \u001b[43mnot_python\u001b[49m\n\n\u001b[0;31mNameError\u001b[0m: name 'not_python' is not defined",
    ],
  ])('minifyErrorOutput', async (traceback: string[], maxCharacters: number, expected: string) => {
    const output = makeNativeErrorOutput(traceback);
    const cache = {} as MinifiedContentCache;
    const minified = await minifyErrorOutput(output, cache, {
      ...default_opts,
      maxCharacters,
    });
    expect(minified.output_type).toEqual('error');
    expect(minified.metadata).toEqual({ meta: 'data' });
    expect(minified.ename).toEqual(output.ename);
    expect(minified.evalue).toEqual(output.evalue);
    expect(minified.traceback).toEqual(expected);
    expect(minified.hash).toEqual(undefined);
    expect(cache).toEqual({});
  });
  test.each([[['123', '456789012345678901'], 20, '123\n456...']])(
    'minifyErrorOutputAndCache',
    async (traceback: string[], maxCharacters: number, expected: string) => {
      const output = makeNativeErrorOutput(traceback);
      const cache = {} as MinifiedContentCache;
      const minified = await minifyErrorOutput(output, cache, {
        ...default_opts,
        maxCharacters,
      });
      const joinedTraceback = typeof traceback === 'string' ? traceback : traceback.join('\n');
      const expectedHash = computeHash(joinedTraceback);
      expect(minified.output_type).toEqual('error');
      expect(minified.metadata).toEqual({ meta: 'data' });
      expect(minified.ename).toEqual(output.ename);
      expect(minified.evalue).toEqual(output.evalue);
      expect(minified.traceback).toEqual(expected);
      expect(minified.hash).toEqual(expectedHash);
      expect(cache[expectedHash]).toEqual([
        joinedTraceback,
        { contentType: 'text/plain', encoding: 'utf8' },
      ]);
    },
  );
});
