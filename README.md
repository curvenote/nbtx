# nbtx: Jupyter Notebook Transformation Library

[![nbtx on npm](https://img.shields.io/npm/v/nbtx.svg)](https://www.npmjs.com/package/nbtx)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/curvenote/nbtx/blob/main/LICENSE)
[![CI](https://github.com/curvenote/nbtx/workflows/CI/badge.svg)](https://github.com/curvenote/nbtx/actions)

Transform Jupyter notebook JSON files (`*.ipynb`) to and from more compact data structures for use in web applications or other contexts where loading component parts (e.g. images, data, etc.) is preferred. For example, in pulling apart a notebook in a publishing workflow the images, interactive charts or other outputs are required either on-disk or through a specific web-request.

## Driving Use Cases

1. Optimize a notebook for a viewing context, so that initial network payload is small (no images, html, data), allowing large components to be loaded lazily.
2. Identify and extract known output images, html and other data for other formats (e.g. JATS, LaTeX, Word), where the images and outputs are required to be accessed independently.
3. Allow for additional, post-processed mimetypes to be added to the transformed notebook (e.g. WebP, thumbnail images) while maintaining a transformation path back to original notebook.

## Scope

The scope of this library is currently isolated to "minifying" large notebook cell outputs, including `stream`, `error`, and mimetype outputs (`update_display_data`, `display_data`, `execute_result`). Large outputs are extracted from the notebook JSON, moved to a cache data structure, and referenced in the notebook by their `hash` and `content_type`. This library also provides a function to restore notebook outputs to their original state, given minifed outputs and the cached output content.

This library uses existing notebook types defined in [nbformat](https://github.com/jupyterlab/jupyterlab/tree/master/packages/nbformat) (see [docs](https://nbformat.readthedocs.io)); the only new types defined in `nbtx` are for "minified" outputs. However, there are no functions for handling entire notebooks; outputs must be isolated prior to invoking `nbtx` functions. This choice allows the library to be used in non-notebook contexts (e.g. [MyST Markdown](https://myst-tools.org)), which include output mime-bundles, but does not conform to the full notebook specification.

## Goals

- Stay as close as possible to the `nbformat` for defining outputs.
- Identify and transforming outputs; `nbtx` does not write files to disk or fetch pieces of a notebook.
- Identify and extract large stream and error outputs, the length can be customized depending on use case.

## Installation

Install using `npm` or `yarn`

```
npm install nbtx
```

## Usage

The following example loads a notebook, then iterates through each cell and, if outputs are present, mutates the cells to include minified `output` objects that reference a separate `outputCache`:

```typescript
import fs from 'fs';
import type { MinifiedContentCache, MinifyOptions } from 'nbtx';
import { minifyCellOutput } from 'nbtx';

const notebook = JSON.parse(fs.readFileSync('my-notebook.ipynb'));
const outputCache: MinifiedContentCache = {};
// Options for minification, see note on hashing below
const opts: Partial<MinifyOptions> = { computeHash };

notebook.cells.forEach((cell) => {
  if (!cell.outputs?.length) return;
  cell.outputs = minifyCellOutput(cell.outputs, outputCache);
});
```

You may then handle the `outputCache` however you want. For example, writing each large output to its own file and updating the cell outputs to point to those files (in this example by adding the `path` field):

```typescript
import { extFromMimeType, walkOutputs } from 'nbtx';

notebook.cells.forEach((cell) => {
  if (!cell.outputs?.length) return;
  walkOutputs(cell.outputs, (output) => {
    if (!output.hash || !outputCache[output.hash]) return;
    const [content, { contentType, encoding }] = outputCache[hash];
    const filename = `${hash}${extFromMimeType(contentType)}`;
    fs.writeFileSync(filename, content, { encoding: encoding as BufferEncoding });
    // The path can be used, for example in a web-context
    output.path = filename;
  });
});
```

You may also rehydrate the original notebook from an `outputCache`:

```typescript
import { convertToIOutputs } from 'nbtx';

notebook.cells.forEach((cell) => {
  if (!cell.outputs?.length) return;
  cell.outputs = convertToIOutputs(cell.outputs, outputCache);
});
```

> **Note**
> Minifying and restoring notebook outputs may change the structure of output text from a string list to a single,
> new-line-delimited string. Both of these formats are acceptable in the notebook types defined by `nbformat`.

## Hashing function

To be able to have no dependencies and also run easily in the browser, `nbtx` does not bundle a hashing library.
To create the `computeHash` function, choose an algorithm, for example, `md5` and digest the content. If you are in the browser, consider using `crypto-js` or some other random function.

```typescript
import { createHash } from 'crypto';

function computeHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}
```

By default `nbtx` will create a random string for the hash and raise a warning.

## Data transformation example

Starting with an `ipynb` JSON document, the following example shows the output transformation for an `execute_result` with three outputs (html, image, text):

```json
{
  ...,
  "cells": [
    {
      "cell_type": "code",
      ...,
      "outputs": {
        "output_type": "execute_result",
        ...,
        "data": {
          "text/html": ["...veryLargeString\n", "on many lines\n"],
          "image/png": "base64-encoded-data-without-a-header",
          "text/plain": ["alt.VConcatChart(...)"],
        }
      }
    }
  ],
  ...
}
```

After `minifyCellOutput` is called and an optional pass to write to disk and add a `path` (as in the above example), the JSON structure would be:

```json
{
  ...,
  "cells": [
    {
      "cell_type": "code",
      ...,
      "outputs": {
        "output_type": "execute_result",
        ...,
        "data": {
          "text/html": {
            "content_type": "text/html",
            "hash": "29cb113f927eb3abba1b303571caa653",
            // The path isn't added by nbtx, but is a common place to put a URL
            "path": "/static/29cb113f927eb3abba1b303571caa653.html"
          },
          "image/png": {
            "content_type": "image/png",
            "hash":  "W5Zulz9J5PLlOkjN2RWMa6CRgJdjxq2r",
            // Known output types are given sensible extensions through `extFromMimeType`
            "path": "/static/W5Zulz9J5PLlOkjN2RWMa6CRgJdjxq2r.png"
          },
          "text/plain": {
            // Small strings are by default not extracted, this can be modified in options
            "content": "alt.VConcatChart(...)",
            "content_type": "text/plain"
          }
        }
      }
    }
  ],
  ...
}
```

Viewing and "rehydration" applications can choose to `walkOutputs` and download the various parts of a notebook, and/or add additional `mimetypes` to the bundle. For example, adding transformations to take screenshots of outputs for long-term preservation or add web-optimized images (e.g. WebP) that were not created in the execution process.

This can be done asyncronously from the first request of notebook content payload, improving pageload speed and leaving it up to the consuming application which of the mime-bundles to fetch.

---

As of v0.4.0 this package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

---

<p style="text-align: center; color: #aaa; padding-top: 50px">
  Made with love by
  <a href="https://continuous.foundation" target="_blank" style="color: #aaa">
    Continuous Science Foundation <img src="https://continuous.foundation/images/logo-small.svg" style="height: 1em" />
  </a>
</p>
