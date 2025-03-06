# nbtx

## 0.4.0

### Minor Changes

- Move to ESM only packaging

## 0.3.0

### Minor Changes

- 61cb5bf: Some vendor mime-bundles resolve to a string, and should not be pushed to file no matter the maxCharacters setting.

## 0.2.3

### Patch Changes

- 7c8bf87: Remove the dependence on `crypto` node library

## 0.2.2

### Patch Changes

- Remove all dependencies (they are only types!) and update the readme with up-to date documentation

## 0.2.1

### Patch Changes

- Change the `walkOutputs` to always walk the outputs regardless of if the hash is present

## 0.2.0

### Patch Changes

- Revamp the library to be focused on pure "minification" and remove all pieces that are specific to Curvenote APIs.
