# locaco

[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

A utility library for downloading and diffing components from GitHub repositories. Makes it easy to build your own **loca**l **co**mponent library management CLI tool.

---

## Features

- Download components from GitHub repositories
- Diff component versions
- Customizable configuration

## Install

```bash
npm install locaco
```

## Usage

`locaco` provides a set of utilities to help you manage component downloads and version diffs. It exports a `createInstance` function that returns three core methods: `init`, `add`, and `diff`. You can use these methods to build your own component management tools.

Here is an example of wrapping `cli` tools with `Command`:

```typescript
import { Command } from 'commander'
import { createInstance } from 'locaco'

const { init, add, diff } = createInstance({
  cwd: process.cwd(),
})

const program = new Command()
program.command('init').action(async (options) => {
  // your custom logic to handle options
  await init(options)
})
program.command('add').action(async (options) => {
  // your custom logic to handle options
  await add(options)
})
program.command('diff').action(async (options) => {
  // your custom logic to handle options
  await diff(options)
})
program.parse(process.argv)
```

## API

### createInstance(options)

Creates a locaco instance with the following methods: `init`, `add`, and `diff`.

#### Options

- `repo`: Source repository name
- `owner`: Repository owner
- `cwd`: Working directory (default: current directory)
- `getTag`: Function to get tag name from version
- `getRelativeFile`: Function to get relative file paths for components
- `dir`: Components directory (default: 'src/components')
- `componentsJson`: Whether to use components.json (default: true)

### Methods

#### init(options?)

Initializes the components.json file.

```typescript
await instance.init({
  extra: { /* additional config */ }
})
```

- `extra`: Additional configuration
- `log`: Whether to log the process

#### add(options?)

Downloads components from the repository.

```typescript
await instance.add({
  components: ['button@1.0.0'],
  version: 'latest',
  overwrite: false
})
```

- `components`: Component names
- `version`: Version to download
- `overwrite`: Whether to overwrite existing files
- `log`: Whether to log the process

#### diff(options)

Shows differences between component versions.

```typescript
await instance.diff({
  component: 'button@2.0.0',
  oldVersion: '1.0.0'
})
```

- `component`: Component name
- `oldVersion`: Old version
- `log`: Whether to log the process
