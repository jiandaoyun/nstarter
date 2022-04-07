---
title: "组件 (Components)"
weight: 101
---

## 组件管理

通常在业务应用实现中，一般都会存在需要依赖外部更加底层的基础工具服务，同时业务应用也会对外提供服务。与上下游服务之间的连接管理对象，在 nstarter 框架中被定义为组件 (Component) 对象。组件可以用于对数据库，缓存的连接管理，也可以用于对于队列服务中间件，定时任务服务等相关基础服务的连接管理。业务应用本身向外部暴露的服务，例如 http 服务，rpc 服务端，websocket 服务端等入口，也采用组件对象的方式进行管理。

针对上下游组件对象的注册与发现，nstarter 提供了一下的工具方法与装饰器：

```typescript
import {
    component,
    injectComponent,
    registerComponent,
    getComponent
} from 'nstarter-core';
```

* 组件定义

  组件对象的申明定义过程比较简单，直接使用框架上提供的 `component` 装饰器来标识绑定相关组件的元数据。

  ```typescript
  import { component } from 'nstarter-core';

  import { AbstractComponent } from './abstract.component';
  import { MongodbConnector } from './lib/database/mongodb.connection';
  import { config } from '../config';
  
  @component()
  export class MongodbComponent extends AbstractComponent {
      private readonly _db: MongodbConnector;
  
      constructor() {
          super();
          this._db = new MongodbConnector(config.database.mongodb, this.  _name);
          this.log();
      }
  
      public get db() {
          return this._db.connection;
      }
  }
  ```

  `component` 装饰器支持两个可选参数，一个是用于对象声明周期管理的 `scope`，另一个是对象标识符 `identifier`。
  
  `scope` 支持三类方式，分别为 `Request`, `Singleton` 以及 `Transient`。可以根据实际情况需要，选择实例的管理方式。
 
    * `Singleton` - 全局单例引用，默认的注册行为，适用于可以全局公用的对象。
    * `Request` - 按照请求上下文单独一个实例，适用于需要在上下文保持唯一引用的场景。
    * `Transient` - 每个依赖单独一个实例，适用于不能被依赖混用的场景。

  实例对象的 `identifier` 用于自定义对象引用的特定标识，默认情况可以让框架自动管理，除非存在特殊情况需要自定义。

  完成组件的定义并不能让组件进入到可用状态，还需要将组件对象注册到专门用于组件管理的管理容器上。通过使用 nstarter-core 所提供的 `registerComponent` 完成组件对象定义完成后的注册工作。随后，对于外部引用依赖，可以直接使用 `getComponent` 方法暴露出对应的组件实例，直接被外部使用。

  ```typescript
  import { registerComponent, getComponent } from 'nstarter-core';
  import { MongodbComponent } from './mongodb.component';

  registerComponent(MongodbComponent);
  export const mongodb = getComponent<MongodbComponent>(MongodbComponent).db;
  ```

* 组件内部引用

  组件定义过程中，允许不同的组件之间相互依赖调用，比如 http 的业务服务需要依赖数据库组件来启动。通过使用框架上提供的 `injectComponent` 装饰器来配合 `component` 便可以完成在一个组件中来调用另一个组件对象的自动注册引用过程。

  ```typescript
  import SocketIO from 'socket.io';
  import { component, injectComponent } from 'nstarter-core';
  
  import { AbstractComponent } from './abstract.component';
  import { WebSocket } from './lib/websocket/socket';
  import { RedisComponent } from './redis.component';
  import { HttpServerComponent } from './http_server.component';
  
  @component()
  export class WsServerComponent extends AbstractComponent {
      private readonly _server: SocketIO.Server;
  
      @injectComponent()
      private _redisComponent: RedisComponent;
  
      @injectComponent()
      private _httpServerComponent: HttpServerComponent;
  
      constructor() {
          super();
          const redis = this._redisComponent.redis,
              httpServer = this._httpServerComponent.server;
          this._server = WebSocket.createServer(redis, httpServer);
          this.log();
      }
  
      public get server() {
          return this._server;
      }
  }
  ```

  `injectComponent` 支持使用自定义的组件标识符进行引用，也可以使用默认行为自动绑定。默认行为下，被引用的对象实例所使用的变量名只要满足对应的驼峰命名规则，即可实现自动的关联注册。
