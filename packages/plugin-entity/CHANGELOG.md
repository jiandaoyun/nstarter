# Changelog

## 0.4.0

* 基础组件升级
  - ajv -> 8.17.1
  - ajv-formats -> 3.0.1
  - reflect-metadata -> 0.2.2
* 支持 `commonJs` + `esModule`


## 0.3.0

* 基础依赖整体升级
* ajv v6 -> v8
  * https://github.com/ajv-validator/ajv/blob/0c40ebfa937d1d9cc01b4c5f06e7edfc4cfd5b00/docs/v6-to-v8-migration.md
* 预定义类型新增引入 ajv-formats 管理

### Breaking
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5
* 升级其他基础包

## 0.2.4

* 支持实体对象使用 _isValid 属性
* ajv 校验返回所有 schema 错误

## 0.2.3 

* 修正 `undefined` 数组入参导致输出为 `{}` 的问题

## 0.2.2

* 调整装饰器暴露形式

## 0.2.1 

* 补充描述信息

## 0.2.0

* 增加对嵌套属性递归实例化的支持
  * 支持嵌套子属性
  * 支持数组子属性定义
* 增加 `entityAttr` 装饰器方法用于定义嵌套实例

## 0.1.0

* 提供初步的实体基类封装形式
* 提供基础实体管理器功能
