import { createHash } from 'crypto';
import type { IDisplayData, IError, IExecuteResult, IStream } from '@jupyterlab/nbformat';

export function computeHash(content: string) {
  return createHash('md5').update(content).digest('hex');
}

export function makeNativeStreamOutput(text?: string | string[]) {
  return {
    output_type: 'stream',
    name: 'stdout',
    text: text ?? 'hello world',
    metadata: { meta: 'data' },
  } as IStream;
}

export function makeNativeErrorOutput(traceback?: string[]) {
  return {
    output_type: 'error',
    ename: 'error-name',
    evalue: 'error-value',
    traceback: traceback ?? ['hello', 'world'],
    metadata: { meta: 'data' },
  } as IError;
}

export function makeNativeMimeOutput(output_type?: string, mimetype?: string, content?: any) {
  return {
    output_type: output_type ?? 'execute_result',
    data: {
      [mimetype ?? 'text/plain']: content ?? 'hello world',
    },
    metadata: { meta: 'data' },
  } as IExecuteResult | IDisplayData;
}
