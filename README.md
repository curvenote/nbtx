# nbtx: Jupyter Notebook Transformation Library

Transform Jupyter notebook JSON files (ipynb) to and from more compact data structures for use in web applications or other contexts where loading in parts is preferred.

## Current Scope

The scope of this library is currently isolated to "minifying" large notebook cell outputs, including `stream`, `error`, and mimetype outputs (`update_display_data`, `display_data`, `execute_result`). Large outputs are extracted from the notebook JSON, moved to a cache data structure, and referenced in the notebook by their hash and content type. This library also provides a function to restore notebook outpus to their original state, given minifed outputs and the cached output content.

This library uses existing notebook types defined in [nbformat](https://github.com/jupyterlab/jupyterlab/tree/master/packages/nbformat); only new types are defined for minified outputs. However, there are no functions for handling entire notebooks; outputs must be isolated prior to invoking `nbtx` functions.

## Installation

Install using `npm` or `yarn`

```
npm install nbtx
```

## Usage

The following example loads a notebook, then iterates through each cell and, if outputs are present, mutates the cells to include minified `output` objects that reference a separate `outputCache`:

```javascript
import fs from 'fs';
import { minifyCellOutput, MinifiedContentCache } from 'nbtx';

const notebook = JSON.parse(fs.readFileSync('my-notebook.ipynb'));
const outputCache: MinifiedContentCache = {};

notebook.cells.forEach((cell) => {
  if (!cell.outputs?.length) return;
  cell.outputs = minifyCellOutput(cell.outputs, outputCache);
});
```

You may then handle the `outputCache` however you want. For example, writing each large output to its own file and updating the cell outputs to point to those files:

```javascript
import { extFromMimeType, walkOutputs } from 'nbtx';

notebook.cells.forEach((cell) => {
  if (!cell.outputs?.length) return;
  walkOutputs(cell.outputs, (output) => {
    if (!output.hash || !outputCache[output.hash]) return;
    const [content, { contentType, encoding }] = outputCache[hash];
    const filename = `${hash}${extFromMimeType(contentType)}`
    fs.writeFileSync(filename, content, { encoding: encoding as BufferEncoding });
    output.path = filename
  })
})
```

You may also rehydrate the original notebook from an `outputCache`:

```javascript
import { convertToIOutputs } from 'nbtx';

notebook.cells.forEach((cell) => {
  if (!cell.outputs?.length) return;
  cell.outputs = convertToIOutputs(cell.outputs, outputCache);
});
```

```note
Minifying and restoring notebook outputs may change the structure of output text from a string list to a single, new-line-delimited string. Both of these formats are acceptable in the notebook types defined by `nbformat`
```
