import type { IStream, IError, ExecutionCount, OutputMetadata } from '@jupyterlab/nbformat';

export interface MinifyOptions {
  maxCharacters: number;
  truncateTo: number;
  computeHash: (content: string) => string;
}

export type MinifiedStreamOutput = { hash?: string; path?: string } & IStream;
export type MinifiedErrorOutput = { hash?: string; path?: string; traceback: string } & IError;

export type MimeOutputType = 'execute_result' | 'display_data' | 'update_display_data';

export interface MinifiedMimePayload {
  content?: string;
  content_type: string;
  hash?: string;
  path?: string;
}

export interface MinifiedMimeBundle {
  [content_type: string]: MinifiedMimePayload;
}

export interface MinifiedMimeOutput {
  output_type: MimeOutputType;
  execution_count?: ExecutionCount;
  metadata: OutputMetadata;
  data: MinifiedMimeBundle;
}

export type MinifiedOutput = MinifiedStreamOutput | MinifiedErrorOutput | MinifiedMimeOutput;

export type MinifiedContent = [string, { contentType: string; encoding: string }];

export type MinifiedContentCache = Record<string, MinifiedContent>;
