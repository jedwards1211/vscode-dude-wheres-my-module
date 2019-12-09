# vscode-dude-wheres-my-module

[![CircleCI](https://circleci.com/gh/jedwards1211/vscode-dude-wheres-my-module.svg?style=svg)](https://circleci.com/gh/jedwards1211/vscode-dude-wheres-my-module)
[![Coverage Status](https://codecov.io/gh/jedwards1211/vscode-dude-wheres-my-module/branch/master/graph/badge.svg)](https://codecov.io/gh/jedwards1211/vscode-dude-wheres-my-module)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/vscode-dude-wheres-my-module.svg)](https://badge.fury.io/js/vscode-dude-wheres-my-module)

Automatic import for JS/Flow

# Overview

This extension uses [`dude-wheres-my-module`](https://github.com/jedwards1211/dude-wheres-my-module), which runs in an external process, so it won't slow down your IDE 🙂

To use it, run the **Add Missing Imports** command (`Ctrl+Alt+I`/`⌃⌘I`);
it will scan the current editor for undeclared identifiers and add import statements for them. Unlike the TypeScript IDE, it doesn't currently suggest imports while you type.

If there is only one suggestion for a given identifier it will add the import automatically. Otherwise,
it will prompt you to pick from the different suggestions.

It will add `import` statements if your file already contains them or has a `@flow` pragma; otherwise it will add `require` statements.

# Limitations

- There are a few cases where obsolete suggested imports
  stick around after you delete them from the file `dude-wheres-my-module` got them from, or delete that file entirely.
- `dude-wheres-my-module` doesn't automatically try to figure out what imports are available from packages in your `node_modules` yet. But the good news is that if you've imported something once in one file, it will be available in suggestions for other files. You can also manually configure preferred imports from packages in `node_modules`
- It can't currently use Flow type information to rule out invalid suggestions (or decide that the way you're using a built-in idea identifier seems to indicate you meant to import something)

# Configuration

See https://github.com/jedwards1211/dude-wheres-my-module#configuration.

# Screenshots

## Selecting from multiple suggestions

![Import Suggestions](/suggestions.png 'Import Suggestions')

## After selecting a suggetion

![Result](/result.png 'Result')
