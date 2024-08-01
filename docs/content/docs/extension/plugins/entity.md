---
title: "nstarter-entity"
---

# nstarter-entity

`nstarter-entity` 面向 `nstarter` Typescript 工程中，标准传输对象实体化的场景，提供了标准的结构管理方式，支持对实体对象进行结构定义，生成并实现结构校验。

## 安装

```bash
npm install -S nstarter-entity
```

实体定义需要使用 typescript-json-schema 作为生成标准 JSON Schema 的工具。需要将其作为开发依赖 (devDependencies) 安装到最终使用的工程中，用于在开发及构建过程中，基于 Typescript 定义生成。

```bash
npm install -D typescript-json-schema
```

> https://github.com/YousefED/typescript-json-schema


## 使用方式

### 实体结构定义

对于实体结构的定义过程，仅需基于 `AbstractEntity` 基类定义新的自定义实体对象，即可实现新的实体对象定义。属性定义过程中，可以使用 `typescript-json-schema` 支持的 jsDoc 注释关键字，进行 Typescript 类型定义以外的 JSON Schema 规则的指定。Typescript 默认常规语法行为，如可选属性、联合类型等，能够被默认自动识别。

* 普通实体结构

  ```typescript
  import { AbstractEntity } from 'nstarter-entity';
  
  export class DemoEntity extends AbstractEntity {
      /**
       * @minimum 0
       * @type integer
       */
      width: number;
  
      /**
       * @minimum 0
       * @type integer
       * @multipleOf 2
       */
      height: number;
  
      /**
       * 信息
       * @default {}
       */
      meta: {
          description?: string
      }
  }
  ```

除了常规的实体结构定义之外，实体结构也支持相互之间的嵌套封装，允许使用实体类本身，作为属性类型。

* 嵌套实体结构

  嵌套场景下，支持子属性实例类型，数组 / 对象子属性的实例类型嵌套。

  ```typescript
  export class WrapperEntity extends AbstractEntity {
      /**
       * @minItems 1
       */
      @entityAttr(DemoEntity)
      items: DemoEntity[];
  
      @entityAttr()
      item: DemoEntity;
  
      @entityAttr(DemoEntity)
      itemMap?: {
          [key: string]: DemoEntity
      };
  }
  ```

  另外，对于子属性的类型定义，也支持使用 `any` 类型，并且能够自动在结构校验过程保留相关属性。

  ```typescript
  export class AnyItemEntity extends AbstractEntity {
      anyItem: any;
  
      anyMap?: {
          [key: string]: any
      };
  }
  ```


> 💡 小技巧：
>
> 除了常规 JSON Schema 注释关键字以外，对于需要隐藏的属性，或者 getter 方法，可以通过 `@ignore` 注释来标注被 JSON Schema 排除。特别是扩展类属性的 getter 方法，默认也会被包含在 JSON Schema 的结构内，但是在实体对象参数的场景下，往往需要排除相关方法生成的对象属性。

### 实体对象实例化

针对不同的场景，实体对象提供了不同的方式供对象实例化过程使用。

* 安全实例化

  实体对象本身默认提供了安全实例化的方式，在创建对象时，直接传入参数即可完成对象初始化过程。
  
  此种方式在实例化对象创建过程中，会自动校验输入参数的结构是否符合 JSON Schema 的设计规定。对于不满足结构规约的参数，会抛出对应的 `ValidationError` 对象返回详细的错误校验信息。

  ```typescript
  // 普通
  const foo = new DemoEntity({
      width: 1,
      height: 2
  });
  
  // 嵌套实例化
  const bar = new WrapperEntity({
      items: [{
         width: 1,
         height: 2
      }],
      item: {
         width: 3,
         height: 4
      }
  });
  ```

  此外，也可以使用实体对象的 `fromJSON` 方法，对空对象实例初始化。

  ```typescript
  // 普通
  const foo = new DemoEntity().fromJSON({
      width: 1,
      height: 2
  });
  
  // 嵌套实例化
  const bar = new WrapperEntity().fromJSON({
      items: [{
         width: 1,
         height: 2
      }],
      item: {
         width: 3,
         height: 4
      }
  });
  ```

* 非安全实例化

  对于入参为可信环境，例如业务逻辑代码内部，或者从安全数据库环境加载数据的过程，在入参本身安全可信的场景下，也可以使用非安全实例化的方式，初始化实体对象。

  实体对象提供了 `assign` 方法，允许将对象属性参数，在不经过结构检查的情况下，直接初始化到空对象实例上，或者也可以用于部分属性的覆盖。

  ```typescript
  // 普通
  const foo = new DemoEntity().assign({
      width: 1,
      height: 2
  });

  // 嵌套实例化
  const bar = new WrapperEntity().assign([{
      items: [{
         width: 1,
         height: 2
      }],
      item: {
         width: 3,
         height: 4
      }
  }]);
  ```

### 生成 JSON Schema

因为实体对象生成过程引入了 JSON Schema 校验机制，项目运行前，需要在编译 typescript 的同时，生成对应数据模型的 Schema 定义资源。可以在 npm script 中添加如下的 `typescript-json-schema` 构建脚本，来生成需要使用的结构定义资源。

```bash
typescript-json-schema \
   ./src/entities/*.ts * \
   --out ./resources/schema.entities.json \
   --required \
   --excludePrivate \
   --ignoreErrors \
   --noExtraProps
```

可以根据实际工程目录情况，自行指定需要包含的实体对象 Typescript 定义文件或者目录，并指定输出目录。schema 生成过程的参数也可以按照实际使用情况。

另外，允许采用多种不同的方式生成多个不同的 JSON Schema 结构定义文件，以用于不同类型的数据结构校验。

更多有关 `typescript-json-schema` 的具体使用方法与参数说明，可以直接参考工具的使用说明文档：

https://github.com/YousefED/typescript-json-schema#command-line

常用的参数说明：

* `--required` - 根据 ts 类型定义生成必填属性声明
* `--excludePrivate` - 排除类型定义中的私有属性
* `--ignoreErrors` - 忽略生成过程错误 (一般对于存在第三方 ts 包引用的场景，需要开启)
* `--noExtraProps` - 禁止传入额外属性

对于前面定义的 DemoEntity，在执行 JSON Schema 生成过程后，可以得到如下的结构定义文件：

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": {
        "DemoEntity": {
            "additionalProperties": false,
            "properties": {
                "height": {
                    "minimum": 0,
                    "multipleOf": 2,
                    "type": "integer"
                },
                "meta": {
                    "additionalProperties": false,
                    "default": {
                    },
                    "properties": {
                        "description": {
                            "type": "string"
                        }
                    },
                    "type": "object"
                },
                "width": {
                    "minimum": 0,
                    "type": "integer"
                }
            },
            "required": [
                "height",
                "meta",
                "width"
            ],
            "type": "object"
        },
        "WrapperEntity": {
            "additionalProperties": false,
            "properties": {
                "item": {
                    "$ref": "#/definitions/DemoEntity"
                },
                "itemMap": {
                    "additionalProperties": {
                        "$ref": "#/definitions/DemoEntity"
                    },
                    "type": "object"
                },
                "items": {
                    "items": {
                        "$ref": "#/definitions/DemoEntity"
                    },
                    "minItems": 1,
                    "type": "array"
                }
            },
            "required": [
                "item",
                "items"
            ],
            "type": "object"
        }
    }
}
```

### 工程启动资源加载

最后，还有非常重要且必要的一点，`nstarter-entity` 本身对 schema 文件名没有详细的位置以及命名规定，所以提供了 `SchemaManager` 对象，用于管理结构定义资源文件的加载与初始化。

```typescript
// 初始化
const schemaManager = SchemaManager.Initialize('./resources/schema.invalid.json');

// 允许加载多个结构定义文件
schemaManager.loadSchemaDefinition('./resources/schema.invalid.json');

// 配置自定义扩展格式
schemaManager.setSchemaFormats({
      'oid': /^[0-9a-f]{24}$/
});
```

为了防止资源加载依赖，产生潜在加载顺序导致先初始化对象实例的情况。建议可以将 `SchemaManager` 初始配置过程编写到独立文件中，在主启动代码的早期加载。

> ⚠ 注意
> 
> 如果结构定义文件存在问题，会存在导致加载过程出现抛错的可能性，需要根据实际情况处理对应的错误信息。

### 实体对象扩展

在实体对象定义基于 `AbstractEntity` 实现了基本初始化、校验、序列化功能的基础上。在实际使用场景中，可以进一步对实体对象进行扩展，额外提供扩展的对象操作方法，或者覆盖实现默认的对象行为等。


## API 说明

* `AbstractEntity` - 实体基类

  - `AbstractEntity(obj?: any)` - 实体对象的安全初始化构造方法，初始对象参数可选。
  
  - `AbstractEntity.prototype.fromJSON(obj: any)` - 对象实例的安全初始化，基于 JSON 数据生成对象实例。
  
  - `AbstractEntity.prototype.assign(obj: any)` - 对象实例的非安全初始化，或者属性覆盖。
    
    一般场景使用默认预定义行为即可满足需要，对于存在特殊属性处理逻辑的情况，可自行在实体对象类定义中 override 相关行为。
  
  - `AbstractEntity.prototype.toJSON(obj: any)` - 用于 JSON 结构序列化的标准接口。

  一般使用默认行为，同样支持在实体类定义中进行扩展。

* `entityAttr` - 嵌套实体属性装饰器
  
  - `@entityAttr(itemCtor?: Constructor)` - 标识可以被递归初始化的子属性，并对于复杂嵌套结构提供必要的子属性实体构造函数。

* `SchemaManager` - Schema 管理器

  - `SchemaManager.Initialize(definintion?: string)` - 初始化，并获取 Schema 管理器对象的**单例**实体。

  - `SchemaManager.prototype.loadSchemaDefinition(definition: string)` - 加载 JSON Schema 结构定义文件，允许多次加载不同文件。

  - `SchemaManager.prototype.setSchemaFormats(format: ISchemaFormats)` - 配置 AJV 的自定义类型校验格式。


## 限制场景

受限于静态 schema 生成原理，以及 typescript 本身的限制，目前的实体对象使用上对于部分复杂场景存在一定的局限性，存在部分需要在使用过程中避开的情况。

1. 实体对象联合类型 / 交叉类型

   局限性：
     - 结构校验: ✓ 
     - 自动实例化: ✗

   在自动生成的 JSON Schema 中，虽然静态生成的结果能够满足联合类型要求，但是在 Typescript 编译过程中中，无法自动生成对应联合类型的有效构造函数，因而无法实现联合类型属性的的递归初始化。相关基于已有对象实体本身定义的类型，需要在子属性类型定义中，避免作为联合类型的子类型使用。特殊场景下如需使用，需要自行实现联合类型具体采用何种类型初始化。

   例如，需要尽量避免以下结构定义的出现。如果存在相关定义必要性，需要自行实现相关子属性对象实例初始化的逻辑。

   ```typescript
   export class UnionTypeEntity extends AbstractEntity {
       item: FooEntity | BarEntity
   }
   ```

2. 泛型实体对象定义

   局限性：
    - 结构校验: ✗
    - 自动实例化: ✗
    
   泛型对象类型，在静态代码分析阶段，实际类型并不明确，目前的自动生成机制，会将泛型类型直接生成为 object 类型，而无法进行内部结构校验，也无法用于嵌套的初始化。对于实体对象的定义，现阶段需要严格避免。

   例如，以下出现的泛型对象属性类型声明方式应当避免：

   ```typescript
   export class GenericEntity<T> extends AbstractEntity {
       item: T
   }
   ```

3. 嵌套接口定义内部实例层级限制

   局限性：
     - 结构校验: ✓
     - 自动实例化: ✗
 
   受限于 JavaScript 对象构造方法传递的层级限制，以及装饰器的使用层级限制，目前的装饰 器实现下，对超过一层中间层的属性，不支持自动传递构造函数定义与创建的方法，相关属性 无法被正确自动初始化，需要手动干预。
   
   对于如下的实体对象数组映射表形式，无法提供完整自动实例化的支持。
 
   ```typescript
   export class WrapperArrayMapEntity extends AbstractEntity {
       @entityAttr(TestEntity)
       itemArrayMap?: {
           [key: string]: DemoEntity[]
       };
   }
   ```
 
   同样，以下复杂结构对象，可以实现接口的安全结构校验初始化，但是无法自动完成实例化。
 
   ```typescript
   export class ComplexItemEntity extends AbstractEntity {
       item: {
           foo: DemoEntity,
           bar: {
               baz: string,
               qux: DemoEntity
           }
       }
   }
   ```

## License
MIT
