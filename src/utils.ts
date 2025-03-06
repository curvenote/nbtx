import { KnownCellOutputMimeTypes } from './types.js';

export function extFromMimeType(mimeType: string) {
  if (mimeType === KnownCellOutputMimeTypes.TextHtml) return '.html';
  if (mimeType === KnownCellOutputMimeTypes.TextLatex) return '.tex';
  if (mimeType.startsWith('text/')) return '.txt';
  if (mimeType.startsWith('image/')) {
    const suffix = mimeType.split('/')[1];
    const ext = suffix.split('+')[0];
    return `.${ext}`;
  }
  return '.json';
}
