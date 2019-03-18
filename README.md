# nstarter - A Node.js Project Template Starter

`nstarter` is a CLI project starter for Node.js projects. You can pack your `tools`/`packages`/`libs`/`modules`/`code-block` into a single template project, and use `nstarter` to initiate a similiar project everywhere.

> ⚠ This tool is currently for private testing only.

## Requirements

* node.js >= 8.0
* npm >= 4.0
* git

## Install

```bash
npm install -g nstarter
```

## Usage

```bash
nstarter [target]

CLI tools to deploy TypeScript project.

Commands:
  nstarter [target]                  CLI tools to deploy TypeScript project.
                                                                       [default]
  nstarter config set <key> <value>  Config template starter options.
  nstarter update template           Update local template cache.
  nstarter clean                     Clear local template cache.

Positionals:
  target  Target deploy path.                                           [string]

Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  --name         Project name.                                          [string]
  --verbose, -v  Show debug info.                                      [boolean]
```

As `nstarter` started, an interactive CLI will ask more options to initiate a new project.

The local template project cache will be cloned at `~/.nstarter/_template/` while running `nstarter` for the first time.


## Config

```bash
nstarter config set <key> <value>

Config template starter options.

Positionals:
  key    The key to set value at.                            [string] [required]
  value  The value to set.                                   [string] [required]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

Here are supported configurations to set by this command.

| Settings | Type | Description |
|:---:|:---:|:---|
| `template` | string | Git repository url of the target template project. |

The local config file will be located at `~/.nstarter/config.json`.


## Templating

You can always create a new custom template project following the templating rule of `nstarter`. A template project could pack whatever *libraries*/*stack*/*code*/*document*/*structure* which you need to start with, and can be build into your personal swiss army knife to generate new projects.

For details to create your own project template, please read more about [templating](./doc/templating.md).


## License

[MIT](./LICENSE)

----

Made on 🌍 with 💓.
