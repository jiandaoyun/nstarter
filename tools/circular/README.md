
## Install

```bash
npm install -g nstarter-circular
```

## Example

```bash
nstarter-circular ./project
```

## Usage

```
Usage: cli [options] <src...>

Options:
  -V, --version           output the version number
  -b, --basedir <path>    base directory for resolving paths
  -x, --exclude <regexp>  exclude modules using RegExp
  -j, --json              output as JSON
  -i, --image <file>      write graph to file as an image
  -l, --layout <name>     layout engine to use for graph (dot/neato/fdp/sfdp/twopi/circo)
  --extensions <list>     comma separated string of valid file extensions
  --no-color              disable color in output and image
  --no-spinner            disable progress spinner
  --warning               show warnings about skipped files
  --debug                 turn on debug output
  -h, --help              output usage information
```
