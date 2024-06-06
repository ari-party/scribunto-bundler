# scribunto-bundler

[![npm version](https://badge.fury.io/js/scribunto-bundler.svg)](https://badge.fury.io/js/scribunto-bundler)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A Lua bundler written in TypeScript for [Scribunto](https://www.mediawiki.org/wiki/Extension:Scribunto).
Automatically detects require statements.

## Installation

```bash
$ npm install scribunto-bundler --global
# or
$ pnpm add scribunto-bundler --global
```

## Usage

### `create`

Creates a [basic project](https://github.com/ari-party/scribunto-bundler/tree/main/templates/create) and installs scribunto-bundler locally using **npm**.

```bash
$ npx scribunto-bundler --create
# or
$ pnpx scribunto-bundler --create
```

### `bundle`

Bundles the main lua file with its defined modules. Modules are only loaded once on [`require()`](https://www.lua.org/pil/8.1.html).

```bash
$ npm run bundle
# or
$ pnpm bundle
```

### Configuration

```js
// bundler.config.js

/** @type {import("scribunto-bundler").Config} */
export default {
  prefix: 'Text that goes infront of the bundled code, e.g. license',
  suffix: 'Text that goes after the bundled code',

  main: 'src/main.lua', // Your main lua file
  out: 'dist/bundled.lua', // The destination file for the bundle command
};
```
