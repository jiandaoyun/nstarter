---
title: "搭建工程模板"
---

# Templating

`nstarter` templates defines the basic structure and components of your project to base on. The table below shows the file organization of a template project.

| Path | Required | Description |
|---|:---:|---|
| `package.json` | ✔ | Npm package config for template itself to be released to npm registry. |
| `module.conf.yml` | ✔ | Module description file of the template project. |
| `template/` | ✔ | Template project root directory. |
| `template/package.json` | ✔ | Npm package description for template. |
| `template/conf.d/*` || Project configuration files. (optional) |
| `template/config.schema.json` || Project configuration shema. (optional) |
| `template/README.md` || Template `README` file. (opitonal) |
| `template/.editorconfig` || Template editor configuration. (opitonal) |
| `template/.gitignore` || Template ignore files for a git repository. (opitonal) |
| `template/tsconfig.json` || Project Typescript config file. (opitonal) |

You can always create a new custom template project following the templating rule of `nstarter`. A template project could pack whatever *libraries*/*stack*/*code*/*document*/*structure* which you need to start with, and can be build into your personal swiss army knife to generate new projects.


## Module Config

A template project should contains a simple `module.conf.yml` file which contains the following opitons to describe the modules in the base project. When deploying with a template project, this module config would help pick components which the user want to use. Only the corresponding modules selected by users would be initialized into generated project.

* `module_types`

  `module_types` defines the first level module category to group different modules in current template project.

  ```yaml
  module_types:
    - name: basic
      label: Basic Modules
  ```

  - `name`: `string`

    The name used as referral key of the module type.

  - `label`: `string`

    Readable name of current module category.


* `modules`

  Module is the basic unit to organize items in a template project. A module definition could contain resource descriptions like *code/resource files*, *config files*, *module dependencies*... For example:

  ```yaml
  modules:
    - name: example
      label: Example Module
      type: basic
      default: true
      files:
        - src/example.ts
      config:
        - server.example
      packages:
        - lodash
      dependencies:
        - http
      scripts:
        - example
  ```

  - `name`: `string`

    The name of current module used as referral key.

  - `label`: `string`

    Semantic name for current module to be listed when using `nstarter`.

  - `type`: `string`

    Category of current module which is declared in `module_types`.

  - `default`: `boolean`

    Whether the module would be selected by default or not. Default: `false`.

  - `files`: `string[]`

    Project file paths which are used by this module only.

  - `config`: `string[]`

    Path of configuration options defined in the template project config files which are only used by current module.

  - `packages`: `string[]`

    Npm packages required by current module only.

  - `dependencies`: `string[]`

    Module names of other template modules required by this module.

  - `scripts`: `string[]`

    Scripts keys defined in the `scripts` section from project's npm `package.json` file, which are only used in current module.


* `ignore_files`

  A template project could also config files to be ignored when deploying in glob format in this section.

  ```yaml
  ignore_files:
    - .git/**
  ```

**NOTE:** All paths from the module config file starts from the template root directory which is `template/` in the project.


## Code Modularization

When starting a new project with custom modules, the implementations of excluded modules should not be initialized into the project. Because of a module code not only could be used in standalone source code files, but also could be used with other modules such as in a "main" file, `nstarter` provides rules to declare multiple module code blocks.

A module code block start with a double-slash comment line with a `#module` prefix following by module `name` declared in `module.conf.yml`. And the module code block should be end with a similar comment line with a `#endmodule` prefix.

In addition, module code block could be nested with each other.

The code below is an example for code modularization in a single file.

```typescript
export const app = express();
app.enable('trust proxy');

//#module web
// view engine setup
app.set('views', config.server.static.views);
app.set('view engine', 'pug');

// static file path
app.use(express.static(config.server.static.public));

// session store
//#module redis
const RedisStore = connectRedis(session);
//#endmodule redis
app.use(session({
    secret: config.server.session.secret,
    name: config.server.session.name,
    resave: false,
    saveUninitialized: false,
    //#module redis
    store: new RedisStore({
        client: Database.redis.connection
    }),
    //#endmodule redis
    cookie: config.server.cookie.policy
}));

// parser setup
app.use(express.json({
    limit: '1mb'
}));
app.use(express.urlencoded({
    limit: '1mb',
    extended: false
}));
app.use(cookieParser());
//#module i18n
app.use(i18n.middleware);
//#endmodule i18n

// request log
if (config.system.req_log.enabled) {
    app.use(reqLogger.middleware);
}

app.use('/', router);
//#endmodule web

export const server = http.createServer(app);
```

The alternative code block to replace the module code block could be declared with comment lines enclosed by `//#alt` and `//#endalt`. When module code block is not used in the target project, it will be replaced with the alternative code.

```typescript
return res.render('welcome', {
    //#module i18n
    //#alt
    //# title: 'To Infinity and Beyond!'
    //#endalt
    title: req.i18n.t('page.demo.title')
    //#endmodule i18n
});
```

## Template Parameters

`nstarter` also supports to initialze project with document files such as markdown. And provides some template paramters to make creating new projects more convenient. You can use `${PARAM}` to declare string to be replaced by corresponding template paramters in any non-code files.

Here are template parameters currently provided by `nstarter`.

| Key | Description |
|:---:|---|
| `APP_NAME` | The project name configured by `nstarter`. |
| `YEAR` | The year of initialzing project with `nstarter`. |

More template parameters would be provided in the future.


## Template Example

A much more specified template project `@nstarter/ts-express` which is used as default template can be found on Github.

[https://github.com/jiandaoyun/nstarter-ts-express](https://github.com/jiandaoyun/nstarter-ts-express)
